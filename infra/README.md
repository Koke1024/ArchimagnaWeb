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

### 方法A: GitHub Actionsで自動実行する（推奨）

`.github/workflows/conoha-mysql-setup.yml` を使うと、手元でSSHコマンドを打たずに
GitHub Actions上から自動でセットアップできます。GitHubのActionsランナーは
通常のインターネット接続を持つため、SSHでVPSに到達できます。

1. リポジトリの **Settings > Secrets and variables > Actions > Environments > Conoha**
   （`Conoha` という名前のEnvironmentを作成し、その配下）で以下を登録する
   （値はGitHub上で暗号化されて保存され、ログにも出力されません。
   ワークフロー側は `environment: Conoha` を指定してこの値を参照します）:

   | シークレット名 | 値 |
   |---|---|
   | `CONOHA_HOST` | `160.251.199.53` |
   | `CONOHA_SSH_USER` | `root`（ダメなら `ubuntu`） |
   | `CONOHA_SSH_PRIVATE_KEY` | SSH秘密鍵の中身（PEM形式そのまま） |
   | `MYSQL_ROOT_PASSWORD` | MySQL rootパスワード（任意の強固な値） |
   | `MYSQL_APP_PASSWORD` | アプリ用ユーザー(`archimagna`)のパスワード（任意の強固な値） |

2. GitHubの **Actions** タブ → **ConoHa MySQL Setup** → **Run workflow** を押す
3. 実行が成功すれば、MySQLのインストールとDB/ユーザー作成が完了する

再実行しても `CREATE DATABASE IF NOT EXISTS` / `CREATE USER IF NOT EXISTS` により
安全に冪等（べきとう）に動作しますが、`MYSQL_ROOT_PASSWORD` は毎回上書き設定される点に
注意してください。

### 方法B: 手元の端末からSSHで手動実行する

このディレクトリの `conoha-mysql-setup.sh` をサーバーに転送し、実行します。
root用パスワードとアプリ用ユーザー(`archimagna`)のパスワードは対話入力です
（スクリプトやリポジトリには一切残りません）。

```bash
scp -i /path/to/private_key infra/conoha-mysql-setup.sh root@160.251.199.53:~/
ssh -i /path/to/private_key root@160.251.199.53 'sudo bash ~/conoha-mysql-setup.sh'
```

いずれの方法でも、スクリプトが行うことは同じです:

- `mysql-server` のインストール、起動
- 外部接続を受け付けるための `bind-address = 0.0.0.0` 設定
- `archi_magna` データベースの作成
- アプリ用ユーザー `archimagna`（ホスト `%`、任意パスワード）の作成と権限付与
- (ufwが有効な場合) 22/3306番ポートの許可

### セットアップ結果を確認する

**ConoHa MySQL Verify** ワークフロー（`.github/workflows/conoha-mysql-verify.yml`）を
実行すると、サーバーの状態を変更せずに以下を確認できます。

- MySQLサービスが起動しているか、バージョン
- `bind-address` の設定値と、3306番ポートの待ち受け状態
- `archi_magna` データベースと `archimagna` ユーザーの存在、テーブル一覧
- インターネット側から3306番ポートに到達できるか

#### 2026-08-23 時点の確認結果

| 項目 | 結果 |
|---|---|
| MySQL | 8.4.10 (Ubuntu 26.04) / active |
| bind-address | `0.0.0.0`（外部接続可） |
| 待ち受け | `0.0.0.0:3306` |
| データベース | `archi_magna` 作成済み |
| ユーザー | `archimagna@%` 作成済み |
| 外部到達性 | 到達可能 |
| テーブル | 未作成（次項のスキーマ投入が必要） |

## 3. テーブルスキーマの投入

このリポジトリには knex のマイグレーションファイルやテーブル定義SQLが
含まれていません。`api/**` 配下のコードから `ROOM_TBL` / `USER_TBL` /
`ACTION_TBL` などのテーブルが必要なことは分かりますが、正確なカラム定義は
既存の本番/開発DBの定義を参照する必要があります。

- 既存DBがある場合: `mysqldump --no-data` でスキーマのみをエクスポートし、
  新しいサーバーへ `mysql archi_magna < schema.sql` でインポートしてください。
- 既存DBがない場合: `api/**` のクエリを基にテーブル定義を新規作成してください。

## 4. Vercel側の環境変数を更新する

> **重要**: `REACT_APP_` から始まる環境変数は、Create React App のビルド時に
> 使用箇所を問わず無条件でクライアント側JSバンドルに埋め込まれ、誰でも閲覧できる
> 状態で公開されます。DB接続情報は `api/**`（サーバー側のみ）で使うため、
> **`REACT_APP_` を付けないでください**。過去に `REACT_APP_DB_*` という名前を
> 使っていたことがあり、これは脆弱性でした（knexfile.js は `DB_*` を参照するよう
> 修正済みです）。

Vercel プロジェクトの Environment Variables に以下を設定し、再デプロイします。

```
DB_HOST=160.251.199.53
DB_USER=archimagna
DB_PASSWORD=<スクリプト実行時に入力したパスワード>
DB_NAME=archi_magna
```

もし過去に `REACT_APP_DB_HOST` / `REACT_APP_DB_USER` / `REACT_APP_DB_PASSWORD` /
`REACT_APP_DB_NAME` を登録していた場合は、上記の `DB_*` を追加したうえで、
**必ず `REACT_APP_DB_*` の方は削除してください**。

## 5. 動作確認

```bash
mysql -h 160.251.199.53 -u archimagna -p archi_magna -e "SHOW TABLES;"
```

デプロイ後、Vercel上のAPI (`/api/room/create` など) が正常にDBへ接続できることを確認してください。
