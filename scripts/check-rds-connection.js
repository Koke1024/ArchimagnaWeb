// scripts/check-rds-connection.js
//
// RDSへの接続性のみを確認する読み取り専用スクリプト。
// データの書き込みは一切行わない。
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.REACT_APP_DB_HOST,
    user: process.env.REACT_APP_DB_USER,
    password: process.env.REACT_APP_DB_PASSWORD,
    database: process.env.REACT_APP_DB_NAME,
    connectTimeout: 10000,
  });

  try {
    const [rooms] = await conn.query('SELECT COUNT(*) AS c FROM ROOM_TBL');
    const [users] = await conn.query('SELECT COUNT(*) AS c FROM USER_TBL');
    const [actions] = await conn.query('SELECT COUNT(*) AS c FROM ACTION_TBL');
    console.log(`接続成功。ROOM=${rooms[0].c}件 USER=${users[0].c}件 ACTION=${actions[0].c}件`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('接続確認に失敗しました:', error.message);
  process.exit(1);
});
