# ConoHa VPS セットアップ手順（ArchimagnaWeb 用 MySQL）

ArchimagnaWeb は Vercel 上のサーバーレス関数 (`api/**`) から knex/mysql2 経由で
MySQL に接続する構成 (`knexfile.js`) になっています。本番用の MySQL を
ConoHa VPS 上に構築するための手順です。

## サーバー情報

| 項目 | 値 |
|---|---|
| サーバー名 | vps-2026-08-23-13-59 |
| グローバルIP (IPv4) | 160.251.199.53 |
| OS | Ubuntu 26.04 (vmi-ubuntu-26.04-amd64) |
| スペック (g2l-p-c4m4) | 4 vCPU / 4GB RAM |
| ディスク | 100GB (ブートボリューム) |
| SSHキーペア | key-2026-08-23-13-59 |

## 実施済みのネットワーク設定

ConoHa APIから、このサーバーのポートに以下のセキュリティグループを追加済みです
（変更前は `default` のみで、外部からSSH/MySQLいずれにも接続できない状態でした）。

- `default`
- `IPv4v6-SSH` (TCP 22 を 0.0.0.0/0 に開放)
- `IPv4v6-MySQL` (TCP 3306 を 0.0.0.0/0 に開放)

> **セキュリティ上の注意**: Vercel のサーバーレス関数は送信元IPが固定されないため、
> MySQLポートは全世界に開放する必要があります。必ず強固なパスワードを設定し、
> 可能であれば定期的なパスワードローテーションやMySQL側のホスト制限を検討してください。

## 1. SSHで接続する

秘密鍵をお手元にお持ちであることを前提としています。ConoHaのUbuntuテンプレートは
`root` ユーザーでの鍵ログインが標準です（ログインできない場合は `ubuntu` ユーザーも
試してください）。

```bash
ssh -i /path/to/private_key root@160.251.199.53
```

## 2. MySQLセットアップスクリプトを実行する

このディレクトリの `conoha-mysql-setup.sh` をサーバーに転送し、実行します。
root用パスワードとアプリ用ユーザー(`archimagna`)のパスワードは対話入力です
（スクリプトやリポジトリには一切残りません）。

```bash
scp -i /path/to/private_key infra/conoha-mysql-setup.sh root@160.251.199.53:~/
ssh -i /path/to/private_key root@160.251.199.53 'sudo bash ~/conoha-mysql-setup.sh'
```

スクリプトが行うこと:

- `mysql-server` のインストール、起動
- 外部接続を受け付けるための `bind-address = 0.0.0.0` 設定
- `archi_magna` データベースの作成
- アプリ用ユーザー `archimagna`（ホスト `%`、任意パスワード）の作成と権限付与
- (ufwが有効な場合) 22/3306番ポートの許可

## 3. テーブルスキーマの投入

このリポジトリには knex のマイグレーションファイルやテーブル定義SQLが
含まれていません。`api/**` 配下のコードから `ROOM_TBL` / `USER_TBL` /
`ACTION_TBL` などのテーブルが必要なことは分かりますが、正確なカラム定義は
既存の本番/開発DBの定義を参照する必要があります。

- 既存DBがある場合: `mysqldump --no-data` でスキーマのみをエクスポートし、
  新しいサーバーへ `mysql archi_magna < schema.sql` でインポートしてください。
- 既存DBがない場合: `api/**` のクエリを基にテーブル定義を新規作成してください。

## 4. Vercel側の環境変数を更新する

Vercel プロジェクトの Environment Variables に以下を設定し、再デプロイします。

```
REACT_APP_DB_HOST=160.251.199.53
REACT_APP_DB_USER=archimagna
REACT_APP_DB_PASSWORD=<スクリプト実行時に入力したパスワード>
REACT_APP_DB_NAME=archi_magna
```

## 5. 動作確認

```bash
mysql -h 160.251.199.53 -u archimagna -p archi_magna -e "SHOW TABLES;"
```

デプロイ後、Vercel上のAPI (`/api/room/create` など) が正常にDBへ接続できることを確認してください。
