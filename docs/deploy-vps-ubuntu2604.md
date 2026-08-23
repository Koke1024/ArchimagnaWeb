# ArchiMagna VPS デプロイ手順書 (ConoHa 4GB / Ubuntu 26.04 LTS)

ConoHa VPS (vCPU 4 / メモリ 4GB / SSD 100GB, Ubuntu 26.04.0 LTS) 上に ArchiMagna を
最初に稼働させるための完全手順書。DungeonMarket を後から同居させる前提の構成
(DungeonMarket はポート 3000〜3002 を使用予定のため、ArchiMagna は **3100** を使う)。

## 全体構成

```
インターネット
   │  https://archimagna.<あなたのドメイン>/
   ▼
Caddy (80/443)  ……………… HTTPS 終端のみ (証明書は Let's Encrypt 自動取得)
   │  reverse_proxy
   ▼
server.cjs (127.0.0.1:3100) … Express。静的配信 (build/) + SPAフォールバック + /api/*
   │  HTTPS (AWS SDK)
   ▼
AWS DynamoDB (ap-northeast-1) … DBはVPS外。VPS側にDB構築は不要
```

- `server.cjs` がフロント静的ファイルと API の両方を単独で配信するため、
  Caddy には HTTPS 終端 (とリバースプロキシ) の役割だけを担わせる。
- ポート 3100 は ufw で外部に開けない。外部からは Caddy 経由 (443) のみアクセス可能。

## 前提

| 項目 | 値 |
|---|---|
| VPS | ConoHa VPS 4GB (Ubuntu 26.04.0 LTS, 既に作成済み) |
| VPS の IP | `203.0.113.10` (例。以後 `<VPS_IP>` と表記) |
| ローカル PC | Windows。SSH 鍵 (ed25519) は既に `~/.ssh/id_ed25519` に作成済み |
| ドメイン | `archimagna.<あなたのドメイン>` (サブドメイン名は未決定のためプレースホルダ) |
| アプリ配置先 | `/var/www/archimagna-web` |
| 実行ユーザー | `archi` (この手順書で作成する作業ユーザー) |

文中の `<VPS_IP>` と `archimagna.<あなたのドメイン>` は自分の環境の値に置き換えること。

## 0. 事前準備 (ローカル PC 側)

### 0.1 コードを VPS に届ける方法を選ぶ

**重要**: ローカルの master には VPS 対応コミット (`7648c55`, `d5d8e84`) が入っているが、
**まだ GitHub (origin) に push されていない** (ahead 2)。VPS 上で `git clone` するには
origin に反映されている必要があるため、次のどちらかを選ぶ。

**(a) 事前に push する (推奨 — VPS 側の手順が最も簡単)**

```powershell
# Windows 側 (S:\Develop\archimagna-web)
git push origin master
```

以後、この手順書の「方法A: git clone」を使う。

**(b) push せずローカルから直接転送する**

push したくない場合は、tar にまとめて scp で送る。
Windows 10/11 には `tar` と `ssh` (OpenSSH) が標準搭載されている。

```powershell
# Windows 側 (S:\Develop\archimagna-web の親ディレクトリで)
# node_modules / build / .vercel など転送不要なものを除外してアーカイブ
cd S:\Develop
tar --exclude node_modules --exclude build --exclude .vercel --exclude .idea -czf archimagna-web.tar.gz archimagna-web

# VPS の root に転送 (パスワードではなく鍵認証。初回は ConoHa 作成時に指定した SSH 鍵を使用)
scp archimagna-web.tar.gz root@<VPS_IP>:/tmp/
```

以後、この手順書の「方法B: tar 転送」を使う。

### 0.2 DNS の A レコードを設定する

ドメイン管理サービス (お名前.com / Cloudflare / Route53 等) で、
`archimagna.<あなたのドメイン>` の **A レコード** を `<VPS_IP>` に向ける。

- Caddy が Let's Encrypt の証明書を発行する際、このドメイン名で 80/443 に到達できる
  必要がある。**DNS 設定を済ませてから Caddy の設定に入ること** (反映に数分〜1時間)。
- 設定後にローカル PC で名前が引けるか確認:

```powershell
nslookup archimagna.<あなたのドメイン>
# → Address: <VPS_IP> と表示されればOK
```

## 1. Ubuntu 初期設定

以降、特に断りがなければ VPS 上での作業。
ローカル PC の PowerShell から `ssh root@<VPS_IP>` でログインして始める
(ConoHa は VPS 作成時に指定した SSH 鍵が root に登録される)。

### 1.1 パッケージの最新化

```bash
sudo apt update && sudo apt upgrade -y
```

- 意味: パッケージ索引の更新と、全パッケージの最新化。
  26.04.0 → 26.04.1 相当のセキュリティ修正が当たる。
- `apt upgrade` 中に「サービス再起動」や「設定ファイルの処理」を尋ねられたら、
  基本はデフォルト (現在の設定を維持 = N) で良い。
- 終わったら `sudo reboot` し、再ログインして続きを行う (カーネル更新が入るため)。

### 1.2 作業ユーザーの作成

ConoHa は root 直ログイン型だが、日常運用は専用ユーザーで行い root ログインを禁止する。

```bash
# archi ユーザーを作成 (パスワードを2回入力する。Full Name 等は空Enterで良い)
sudo adduser archi

# sudo グループに追加 (管理者権限)
sudo gpasswd -a archi sudo

# root に登録済みの SSH 公開鍵を archi にコピー (ConoHa で作成時に指定した鍵がそのまま使える)
sudo mkdir -p /home/archi/.ssh
sudo cp /root/.ssh/authorized_keys /home/archi/.ssh/
sudo chown -R archi:archi /home/archi/.ssh
sudo chmod 700 /home/archi/.ssh
sudo chmod 600 /home/archi/.ssh/authorized_keys
```

- 意図: 鍵認証の設定を root から引き継ぎ、archi で鍵ログインできるようにする。

ここで **archi でログインできることを確認** してから次へ進む
(ローカル PC から別ターミナルで `ssh archi@<VPS_IP>`)。

### 1.3 root ログイン・パスワード認証の禁止

```bash
# ハードニング設定をドロップインファイルで追加 (sshd_config 本体は編集しない)
sudo tee /etc/ssh/sshd_config.d/99-hardening.conf <<'EOF'
PermitRootLogin no
PasswordAuthentication no
EOF

# 書式チェック (何も出なければOK。エラーが出たら書き直す)
sudo sshd -t

# 反映
sudo systemctl restart ssh
```

- 意図: root 直ログインと総当たり攻撃対象になるパスワード認証を封じる。
- **必ず archi でログインできることを確認してから** root のセッションを閉じること。
  間違って締め出した場合は ConoHa のコンソール (Web 画面) からログインして
  `/etc/ssh/sshd_config.d/99-hardening.conf` を削除すれば復旧できる。

以降の作業は `ssh archi@<VPS_IP>` で行う。

### 1.4 ファイアウォール (ufw)

```bash
sudo ufw allow OpenSSH   # 22/tcp (SSH)
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt 認証 + HTTP→HTTPS リダイレクト)
sudo ufw allow 443/tcp   # HTTPS (Caddy)
sudo ufw enable          # → "Command may disrupt existing SSH connections" と聞かれるので y
sudo ufw status
```

- 意図: 外部に開けるのは 22 / 80 / 443 のみ。**3100 は開けない**
  (Caddy が同一マシン内から 127.0.0.1:3100 に繋ぐため、外への開放が不要)。
- 誤って設定したルールを消すには `sudo ufw status numbered` で番号を確認して
  `sudo ufw delete <番号>`。

### 1.5 swap 2GB の作成

メモリ 4GB あれば通常足りるが、`npm run build` (react-scripts はビルド時 2GB 近く
消費することがある) や今後 DungeonMarket を同居させる際の保険として作る。

```bash
# 2GB のスワップファイルを作成
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 再起動後も有効化 (/etc/fstab に追記)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# スワップをあまり使わないようチューニング (任意だが推奨)
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swap.conf
sudo sysctl -p /etc/sysctl.d/99-swap.conf

# 確認: Swap: 2.0Gi と表示されればOK
free -h
```

### 1.6 自動セキュリティ更新 (unattended-upgrades)

```bash
sudo apt install -y unattended-upgrades
# 設定を有効化 (質問には <はい> を選択)
sudo dpkg-reconfigure -plow unattended-upgrades

# 確認: "Activating apt... Unattended upgrades are enabled" 的な出力があれば有効
cat /var/lib/apt/periodic/update-success-stamp 2>/dev/null || systemctl status apt-daily-upgrade.timer --no-pager | head -3
```

- 意図: セキュリティ修正のみ自動適用。通常のバージョンアップは自動で入らない。

## 2. Node.js 22 + PM2 + Caddy のインストール

### 2.1 Node.js 22 (NodeSource 公式リポジトリ)

systemd + PM2 で運用するため、システムワイドに入る NodeSource を**推奨**する。

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# 確認 (v22.x.x と出ればOK)
node -v
npm -v
```

- 代替: nvm を使うこともできるが、nvm はユーザー単位のインストールのため
  `pm2 startup` が生成する systemd ユニット内の node パスが
  `/home/archi/.nvm/...` に依存し、トラブルの種になりやすい。特段の理由がなければ NodeSource を使うこと。

### 2.2 PM2

```bash
sudo npm install -g pm2
pm2 -v
```

- 役割: Node プロセスのデーモン化・自動再起動・起動時ログ。
  PM2 による OS 起動時の自動復帰は 3.6 で設定する。

### 2.3 Caddy

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

caddy version
```

- 役割: HTTPS リバースプロキシ。設定は 4 で行う (先に DNS が済んでいないと
  証明書発行に失敗するため、ここではインストールのみ)。
- 注: Caddy 公式リポジトリの `debian.deb.txt` が Ubuntu 26.04 用コード名を
  まだ提供していない場合、リポジトリ登録時にエラーとなる。その場合は
  `/etc/apt/sources.list.d/caddy-stable.list` 内のコード名を直近 LTS (例: noble)
  に書き換えて `sudo apt update` し直せばインストールできる (Caddy は静的バイナリに
  近く、ディストロ差の影響はほぼない)。

## 3. ArchiMagna のデプロイ

### 3.1 コードの配置

**方法A: git clone (0.1 (a) で push した場合)**

```bash
sudo mkdir -p /var/www
sudo chown archi:archi /var/www
git clone https://github.com/Koke1024/ArchimagnaWeb.git /var/www/archimagna-web
cd /var/www/archimagna-web
```

- 意図: 今後の更新が `git pull` で済む。clone は archi ユーザーで行い、
  `/var/www` を archi 所有にして sudo 不要で作業できるようにする。

**方法B: tar 転送 (0.1 (b) の場合)**

```bash
sudo mkdir -p /var/www
sudo chown archi:archi /var/www
tar xzf /tmp/archimagna-web.tar.gz -C /var/www
rm /tmp/archimagna-web.tar.gz
cd /var/www/archimagna-web
```

- 注: 今後の更新は再び tar 転送か、改めて git clone に切り替える必要がある。

### 3.2 `.env.server` の作成 (AWS 資格情報)

```bash
cp .env.server.example .env.server
nano .env.server
```

記載内容 (README「開発者向け」の IAM 設定で作成した値を使用):

```ini
AWS_REGION=ap-northeast-1
DYNAMODB_TABLE=archimagna
AWS_ACCESS_KEY_ID=<実際のアクセスキー>
AWS_SECRET_ACCESS_KEY=<実際のシークレットキー>
PORT=3100
```

- 役割: `ecosystem.archimagna.cjs` が PM2 起動時にこのファイルを読み込み、
  環境変数として server.cjs / DynamoDB クライアントに渡す。
- `.env.server` は `.gitignore` 登録済みのためコミットされる心配はない。
- **VPS側にDB構築は不要**。DynamoDB テーブル (`archimagna`) は既存のものをそのまま使う。
  テーブルがまだ無い場合は README「開発者向け」の手順で先に作成しておくこと。

### 3.3 依存インストールとビルド

```bash
# package-lock.json に基づき再現性のあるインストール
npm ci

# フロントの本番ビルド (build/ に成果物が出る。1〜3分かかる)
npm run build
```

- `npm ci` を使う理由: `npm install` と異なり lock ファイル厳密守で、
  サーバーとローカルで同じバージョン構成になる。
- メモリ不足でビルドが `Killed` と出て落ちる場合は `free -h` で swap を確認
  (1.5 で swap 2GB を作成済みのはず)。

### 3.4 PM2 で起動

```bash
# ecosystem 設定から起動 (archimagna という名前で管理される)
pm2 start ecosystem.archimagna.cjs

# 状態確認 (online と出ればOK)
pm2 status

# 起動ログにエラーが出ていないか確認
pm2 logs archimagna --lines 30
# → [archimagna] API server listening on :3100 と出ていれば起動成功
```

### 3.5 ローカルからの応答確認 (Caddy 設定前)

```bash
curl -s http://localhost:3100/api/health
# → {"status":"ok","uptime":...} と返れば server.cjs は正常
```

- この時点では HTTP (暗号化なし) のローカルホスト接続。外部には公開されていない。

### 3.6 PM2 の OS 起動時自動復帰

```bash
# 現在のプロセス構成を保存
pm2 save

# systemd サービスを登録 (コマンドを実行すると「sudo env PATH=... を実行せよ」と
# 表示されるので、表示されたコマンドをそのままコピーして実行する)
pm2 startup systemd -u archi --hp /home/archi
```

- 意図: VPS 再起動時に PM2 デーモンが自動起動し、`pm2 save` した構成
  (archimagna プロセス) が復元される。
- 確認: `systemctl status pm2-archi` で active になっていること。

## 4. Caddy の設定 (HTTPS)

### 4.1 Caddyfile の編集

```bash
sudo nano /etc/caddy/Caddyfile
```

ファイルの中身を以下にする (既存のサンプルコメントは削除して良い):

```
archimagna.<あなたのドメイン> {
    reverse_proxy 127.0.0.1:3100
}
```

- 意図: このドメインへの HTTPS 接続を終端し、同じマシンの server.cjs (3100) へ流す。
  証明書の取得・更新は Caddy が全自动で行う (書くことは一切ない)。
- 静的ファイルも API も server.cjs が配信するため、Caddy 側に `root` 等の設定は不要。

### 4.2 反応

```bash
# 書式検査
sudo caddy validate --config /etc/caddy/Caddyfile

# 再読み込み (この瞬間に Let's Encrypt の証明書取得が走る)
sudo systemctl reload caddy

# 証明書取得の様子を確認 (issued certificate のログを探す)
sudo journalctl -u caddy -n 30 --no-pager
```

## 5. 動作確認 (完了条件)

ローカル PC のブラウザ/PowerShell から実施する。

### 5.1 ヘルスチェック

```powershell
curl.exe -s https://archimagna.<あなたのドメイン>/api/health
# → {"status":"ok",...} が返れば HTTPS + リバースプロキシ + アプリの全経路が正常
```

### 5.2 フロント表示

ブラウザで `https://archimagna.<あなたのドメイン>/` を開き、ArchiMagna の
トップ画面が表示されること。URL 欄が鍵アイコン (有効な証明書) であることも確認する。
さらに適当な別パス (例: `/room/xxxx`) を直接開いてもトップ画面 (index.html) に
フォールバックすることを確認 (SPA ルーティングの動作)。

### 5.3 ルーム作成 (DynamoDB 往路確認)

トップ画面から **ルーム作成を 1 回** 行い、正常にルームが作成できること。
これが通れば `.env.server` の AWS 資格情報と DynamoDB テーブル接続も正しい。
(失敗する場合は 6.5 を参照)

## 6. トラブルシュート

### 6.1 pm2 status が errored / 起動を繰り返す

```bash
pm2 logs archimagna --lines 50
```

- `EADDRINUSE :::3100` → ポート衝突。`ss -tlnp | grep 3100` で占有プロセスを特定。
  DungeonMarket 等、別アプリが 3100 を使っていないか確認。
- `Cannot find module '...'` → `/var/www/archimagna-web` 以外のディレクトリで
  `pm2 start` していないか確認。ecosystem は `__dirname` 基準で動くため、
  必ずアプリ ディレクトリ内で起動する。誤って変な登録が残ったら
  `pm2 delete archimagna` してやり直す。
- `.env.server` の AWS 鍵誤り → 起動自体はするが API が 500 を返す (6.5 参照)。

### 6.2 build/ が無くトップ画面が真っ白 / 404

`npm run build` を忘れていると `express.static` が何も返さない。

```bash
cd /var/www/archimagna-web && npm run build && pm2 restart archimagna
```

### 6.3 Caddy の証明書が取得できない

```bash
sudo journalctl -u caddy -n 50 --no-pager
# "could not get certificate ... timeout / connection refused / dns problem" を探す
```

原因はほぼ次のいずれか:

1. **DNS 未反映**: `nslookup archimagna.<あなたのドメイン>` が `<VPS_IP>` を返すか確認。
2. **80/443 未開放**: `sudo ufw status` で両方が ALLOW になっているか確認。
3. **レート制限**: 短期間に何度も取得を試みると Let's Encrypt の制限 (1週間に5回等) に
   掛かる。設定を修正せずリロードを繰り返さない。1時間ほど置いてから
   `sudo systemctl reload caddy` を1回だけ実行する。

### 6.4 SSH で締め出された

ConoHa コントロールパネル →「コンソール」(VNC) から root でログインし:

```bash
sudo ufw status numbered     # 誤ったルールを確認
sudo ufw delete <番号>
# sshd 設定を壊した場合は該当ファイルを戻す
sudo rm /etc/ssh/sshd_config.d/99-hardening.conf
sudo systemctl restart ssh
```

### 6.5 API だけ 500 / ルーム作成が失敗する (DynamoDB 接続問題)

```bash
pm2 logs archimagna --lines 50   # AccessDenied / UnrecognizedClientException 等を確認
```

- `UnrecognizedClientException` → `.env.server` のアクセスキー/シークレットの誤り
  (前後の空白や改行も原因になる)。修正後 `pm2 restart archimagna`。
- `AccessDeniedException` → IAM ユーザーに DynamoDB 権限がない。README の IAM 設定を確認。
- `Requested resource not found` → `DYNAMODB_TABLE` の名前誤り、またはリージョン誤り。
- それでも不明な場合、VPS 上のソースを直接確認:
  `curl -s http://localhost:3100/api/health` が通るのに
  `https://.../api/health` が通らないなら Caddy 問題、両方通るのにルーム作成だけ
  失敗するなら AWS 側の問題、と切り分けられる。

### 6.6 npm ci が失敗する

- ネットワークタイムアウト → 単純に再実行で直ることが多い。
- ディスク不足 → `df -h /` で確認 (node_modules + build で 1GB 前後使用)。

## 7. 日常運用コマンド

| 操作 | コマンド |
|---|---|
| 状態確認 | `pm2 status` |
| ログ見る | `pm2 logs archimagna` (Ctrl+C で終了) |
| 再起動 | `pm2 restart archimagna` |
| 停止 / 復帰 | `pm2 stop archimagna` / `pm2 start archimagna` |
| ログファイル場所 | `~/.pm2/logs/archimagna-out.log` / `archimagna-error.log` |

### アプリ更新時の手順 (方法A: git の場合)

```bash
cd /var/www/archimagna-web
git pull
npm ci
npm run build
pm2 restart archimagna
```

### DungeonMarket 同居時の注意 (将来向け)

- DungeonMarket は 3000〜3002 を使用予定。ArchiMagna は 3100 固定で衝突しない。
- DungeonMarket 用の Caddy サイトブロックを同じ Caddyfile に追記すれば、
  1 つの Caddy で複数ドメインを運用できる (両方 `reverse_proxy` を書くだけ)。
- メモリに余裕を持たせるため、swap (1.5) は削らないこと。

## 8. セキュリティチェックリスト (最終確認)

- [ ] `ssh root@<VPS_IP>` が **拒否される** こと (PermitRootLogin no)
- [ ] パスワード認証での SSH ログインが拒否されること (PasswordAuthentication no)
- [ ] `sudo ufw status` で 22 / 80 / 443 のみ開放
- [ ] `https://archimagna.<あなたのドメイン>/api/health` が 200
- [ ] トップ画面表示 + ルーム作成が成功
- [ ] `pm2 save` 済み + `systemctl status pm2-archi` が active
  (VPS 再起動後に自動で復帰する)
