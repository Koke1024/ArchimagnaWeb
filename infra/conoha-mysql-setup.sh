#!/usr/bin/env bash
# ArchimagnaWeb 用 MySQL セットアップスクリプト (ConoHa VPS / Ubuntu 26.04 想定)
#
# 使い方:
#   1. SSHでサーバーにログインする
#   2. このスクリプトをサーバーに転送する (scp infra/conoha-mysql-setup.sh <user>@<host>:~/)
#   3. サーバー上で実行する: sudo bash conoha-mysql-setup.sh
#
# root / アプリ用パスワードは対話入力です。スクリプト内には残しません。
set -euo pipefail

DB_NAME="archi_magna"
DB_USER="archimagna"

if [[ ${EUID} -ne 0 ]]; then
  echo "root権限で実行してください (sudo bash $0)" >&2
  exit 1
fi

read -rsp "MySQL の新しい root パスワードを入力: " MYSQL_ROOT_PASSWORD
echo
read -rsp "アプリ用ユーザー(${DB_USER})のパスワードを入力: " APP_DB_PASSWORD
echo

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

mysql --user=root <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${APP_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

# ufw が有効な場合はポートを開放しておく（ConoHaのセキュリティグループとは別レイヤー）
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 22/tcp || true
  ufw allow 3306/tcp || true
fi

cat <<EOM

セットアップ完了。Vercel の環境変数に以下を設定してください:
  REACT_APP_DB_HOST=<このサーバーのグローバルIPアドレス>
  REACT_APP_DB_USER=${DB_USER}
  REACT_APP_DB_PASSWORD=<今回入力したアプリ用パスワード>
  REACT_APP_DB_NAME=${DB_NAME}
EOM
