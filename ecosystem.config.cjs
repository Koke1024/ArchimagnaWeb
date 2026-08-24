// ecosystem.config.cjs
// ArchiMagna セルフホストサーバー (server.cjs) の PM2 プロセス管理設定。
//
// 注意: PM2 7系では任意のファイル名 (例: ecosystem.archimagna.cjs) で
// `pm2 start <file>` すると設定ファイルとしてではなくスクリプトとして
// 実行されてしまう (プロセスは online になるが何もリッスンしない)。
// そのため PM2 標準の ecosystem.config.* 命名でこのファイルを用意した。
// 起動は `pm2 start ecosystem.config.cjs` を使うこと。
//
// ConoHa VPS 上で DungeonMarket と同居させることを想定し、ポートは
// DM (3000/3001/3002) と衝突しない 3100 を既定とする。
//
// 起動:   pm2 start ecosystem.config.cjs
// 状態:   pm2 status
// 再起動: pm2 restart archimagna
const fs = require('fs');
const path = require('path');

// .env.server (本番用のAWS資格情報等) があれば読み込んで環境変数へ展開する。
// Vercel と違いセルフホストでは環境変数の注入先がないため、このファイルで管理する。
const envFile = path.join(__dirname, '.env.server');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2];
    }
  }
}

/** @type {import('pm2').PM2AppSchema[]} */
const apps = [
  {
    name: 'archimagna',
    script: 'server.cjs',
    env: {
      NODE_ENV: 'production',
      PORT: 3100,
    },
    instances: 1, // ステートレスAPIだがDynamoDBコネクション共用のため単一で十分
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
  },
];

module.exports = { apps };
