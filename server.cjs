// server.cjs
// ArchiMagna API・フロント配信用のセルフホストサーバー (ConoHa VPS等向け)。
//
// 背景: 本プロジェクトのAPIは Vercel Serverless Functions (api/ 配下) として
// 実装されている。VPS上で稼働させるため、各ハンドラを Express にマウントする
// 薄いラッパーとしてこのファイルを用意した。ハンドラ側は Vercel 互換
// (module.exports = async function handler(req, res)) のまま変更不要で、
// Vercel と VPS の両方で同一コードが動く。
//
// 構成 (VPS本番): Caddy (HTTPS終端・静的ファイル配信) → /api/* をこのサーバーへリバースプロキシ
// 構成 (単体起動): このサーバーが build/ の静的ファイルも配信するため、
//                  Caddy なしでも http://localhost:PORT/ で動作確認できる。
//
// 環境変数:
//   PORT             リッスンポート (既定 3100)
//   AWS_REGION 等    api/_lib/dynamo.js が参照 (DynamoDB接続)
//
// 起動: npm run serve / pm2 start ecosystem.archimagna.cjs
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3100;

// Vercel の @vercel/node と同じ挙動 (JSONボディ/URLエンコードの自動パース) を再現。
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── ヘルスチェック ─────────────────────────────────────────
// 動作監視 (UptimeRobot / Caddy healthcheck) 用のエンドポイント。
// DynamoDB には接続しないので起動確認だけで課金影響はない。
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ── API ルーティング ───────────────────────────────────────
// 各ハンドラは内部で req.method を検査するため、app.all で全メソッドを受け
// 判定はハンドラ側に任せる (Vercel 上の挙動と一致させるため)。
const routes = [
  ['/api/room/create', './api/room/create.js'],
  ['/api/room/info', './api/room/info.js'],
  ['/api/room/info_by_user', './api/room/info_by_user.js'],
  ['/api/room/next', './api/room/next.js'],
  ['/api/room/assign/auto', './api/room/assign/auto.js'],
  ['/api/game/action', './api/game/action.js'],
  ['/api/game/log', './api/game/log.js'],
  ['/api/game/log_user', './api/game/log_user.js'],
  ['/api/user/add', './api/user/add.js'],
  ['/api/user/info', './api/user/info.js'],
  ['/api/user/list', './api/user/list.js'],
  ['/api/user/update', './api/user/update.js'],
];

for (const [route, handlerPath] of routes) {
  const handler = require(handlerPath);
  app.all(route, handler);
}

// ── 静的フロント配信 (任意) ────────────────────────────────
// Create React App のビルド成果物 (build/) を配信する。
// 本番では Caddy が前面で配信するためこのブロックは使われないが、
// Caddy 前倒しの検証や緊急時の単体運用で役立つため残している。
const buildDir = path.join(__dirname, 'build');
app.use(express.static(buildDir));
// SPA フォールバック: /api以外の任意パスを index.html へ (React Router 用)。
app.get(/^\/(?!api\/).*/, (_req, res) => {
  res.sendFile(path.join(buildDir, 'index.html'));
});

// ── エラーハンドリング ─────────────────────────────────────
// ハンドラ内で捕捉されなかった例外をここで受けてプロセス落下を防ぐ。
app.use((err, _req, res, _next) => {
  console.error('[server] unhandled error:', err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`[archimagna] API server listening on :${PORT}`);
});
