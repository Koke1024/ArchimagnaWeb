#!/usr/bin/env bash
# ArchimagnaWeb 用 MySQL セットアップスクリプト (ConoHa VPS / Ubuntu 26.04 想定)
#
# 手動実行の場合:
#   1. SSHでサーバーにログインする
#   2. このスクリプトをサーバーに転送する (scp infra/conoha-mysql-setup.sh <user>@<host>:~/)
#   3. サーバー上で実行する: sudo bash conoha-mysql-setup.sh
#      -> root / アプリ用パスワードは対話入力になります
#
# CI (GitHub Actions) から実行する場合:
#   環境変数 MYSQL_ROOT_PASSWORD / APP_DB_PASSWORD が設定されていれば
#   対話入力をスキップして自動実行します。
#   (.github/workflows/conoha-mysql-setup.yml を参照)
set -euo pipefail

DB_NAME="archi_magna"
DB_USER="archimagna"

if [[ ${EUID} -ne 0 ]]; then
  echo "root権限で実行してください (sudo bash $0)" >&2
  exit 1
fi

prompt_password() {
  # $1: 変数名, $2: プロンプト文言
  local var_name="$1" prompt="$2" value
  if [[ -n "${!var_name:-}" ]]; then
    return 0
  fi
  if [[ ! -t 0 ]]; then
    echo "${var_name} が未設定です。非対話実行では環境変数として渡してください。" >&2
    echo "例: sudo ${var_name}=... bash $0" >&2
    exit 1
  fi
  read -rsp "${prompt}" value
  echo
  printf -v "${var_name}" '%s' "${value}"
}

prompt_password MYSQL_ROOT_PASSWORD "MySQL の新しい root パスワードを入力: "
prompt_password APP_DB_PASSWORD "アプリ用ユーザー(${DB_USER})のパスワードを入力: "

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y mysql-server

systemctl enable --now mysql

# Vercel など外部から接続できるように bind-address を変更
CNF_FILE="/etc/mysql/mysql.conf.d/mysqld.cnf"
if [[ -f "${CNF_FILE}" ]]; then
  sed -i 's/^bind-address\s*=.*/bind-address = 0.0.0.0/' "${CNF_FILE}"
fi

systemctl restart mysql

# 初回実行時の root は auth_socket 認証(パスワード不要)だが、2回目以降は
# 前回このスクリプトが設定したパスワードでの認証が必要になる。
# MYSQL_PWD を指定しておけば、auth_socket 認証時は無視され、
# パスワード認証時にはそのまま使われるためどちらでも動作する。
MYSQL_PWD="${MYSQL_ROOT_PASSWORD}" mysql --user=root <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';
ALTER USER '${DB_USER}'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

# ufw が有効な場合はポートを開放しておく（ConoHaのセキュリティグループとは別レイヤー）
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 22/tcp || true
  ufw allow 3306/tcp || true
fi

cat <<EOM

セットアップ完了。Vercel の環境変数に以下を設定してください
(REACT_APP_ 接頭辞を付けるとクライアント側に漏洩するため付けないこと):
  DB_HOST=<このサーバーのグローバルIPアドレス>
  DB_USER=${DB_USER}
  DB_PASSWORD=<今回入力したアプリ用パスワード>
  DB_NAME=${DB_NAME}
EOM
