// scripts/migrate-mysql-to-dynamo.js
//
// 既存のMySQL(RDS)からDynamoDBへ既存データを一度だけ移行するスクリプト。
// ROOM_ID / USER_ID / TOKEN は既にプレイヤーへ配布済みのURLに埋め込まれている可能性があるため、
// 新規採番はせず、MySQL上の値をそのままDynamoDBへ引き継ぐ。
//
// 移行後、ROOM/USERのIDカウンタをMySQL側の最大値に合わせておくことで、
// 移行後にDynamoDB側で新規採番されるIDが既存IDと衝突しないようにする。
//
// 事前準備:
//   本番運用ではmysql2をpackage.jsonから外しているため、実行前に一時的にインストールする。
//     npm install --no-save mysql2
//
// 実行方法:
//   REACT_APP_DB_HOST=... REACT_APP_DB_USER=... REACT_APP_DB_PASSWORD=... REACT_APP_DB_NAME=... \
//   AWS_REGION=ap-northeast-1 DYNAMODB_TABLE=archimagna \
//   node scripts/migrate-mysql-to-dynamo.js
// コマンドラインや許可ルールに接続情報を平文で残さないよう、.env.localから直接読み込む
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const mysql = require('mysql2/promise');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'archimagna';
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'ap-northeast-1' });
const doc = DynamoDBDocumentClient.from(dynamoClient, { marshallOptions: { removeUndefinedValues: true } });

const USER_ID_PAD = 10;
const TIMESTAMP_PAD = 14;

function roomItem(row) {
  return {
    PK: `ROOM#${row.ROOM_ID}`,
    SK: 'META',
    Type: 'ROOM',
    ROOM_ID: row.ROOM_ID,
    TOKEN: row.TOKEN,
    DAY: row.DAY,
    PHASE: row.PHASE,
    GSI1PK: `TOKEN#${row.TOKEN}`,
    GSI1SK: `ROOM#${row.ROOM_ID}`,
  };
}

function userItem(row) {
  return {
    PK: `ROOM#${row.ROOM_ID}`,
    SK: `USER#${String(row.USER_ID).padStart(USER_ID_PAD, '0')}`,
    Type: 'USER',
    USER_ID: row.USER_ID,
    USER_NAME: row.USER_NAME,
    ROOM_ID: row.ROOM_ID,
    USER_ORDER: row.USER_ORDER,
    TOKEN: row.TOKEN,
    TEAM: row.TEAM,
    ROLE: row.ROLE,
    MANA: row.MANA,
    HP: row.HP,
    GSI1PK: `TOKEN#${row.TOKEN}`,
    GSI1SK: `USER#${row.USER_ID}`,
  };
}

// 元のACTION_LOG_ID(連番)を末尾に付与し、同一UPD_DATE同士でも
// MySQL側の挿入順(=ACTION_LOG_ID順)を安定して保持できるようにする
function actionItem(row) {
  const ts = new Date(row.UPD_DATE).getTime().toString().padStart(TIMESTAMP_PAD, '0');
  const seq = String(row.ACTION_LOG_ID).padStart(TIMESTAMP_PAD, '0');
  return {
    PK: `ROOM#${row.ROOM_ID}`,
    SK: `ACTION#${ts}#${seq}`,
    Type: 'ACTION',
    ACTION_ID: row.ACTION_ID,
    USER_ID: row.USER_ID,
    ACTION_TARGET: row.ACTION_TARGET,
    DAY: row.DAY,
    ROOM_ID: row.ROOM_ID,
    UPD_DATE: new Date(row.UPD_DATE).toISOString(),
  };
}

function counterItem(name, value) {
  return { PK: `COUNTER#${name}`, SK: `COUNTER#${name}`, Value: value };
}

async function putAll(items) {
  for (let i = 0; i < items.length; i += 25) {
    const chunk = items.slice(i, i + 25);
    await doc.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: chunk.map((item) => ({ PutRequest: { Item: item } })),
      },
    }));
  }
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.REACT_APP_DB_HOST,
    user: process.env.REACT_APP_DB_USER,
    password: process.env.REACT_APP_DB_PASSWORD,
    database: process.env.REACT_APP_DB_NAME,
  });

  try {
    const [rooms] = await conn.query('SELECT * FROM ROOM_TBL');
    const [users] = await conn.query('SELECT * FROM USER_TBL');
    const [actions] = await conn.query('SELECT * FROM ACTION_TBL');

    console.log(`移行対象: ROOM ${rooms.length}件 / USER ${users.length}件 / ACTION ${actions.length}件`);

    await putAll(rooms.map(roomItem));
    await putAll(users.map(userItem));
    await putAll(actions.map(actionItem));

    const maxRoomId = rooms.reduce((max, r) => Math.max(max, r.ROOM_ID), 0);
    const maxUserId = users.reduce((max, u) => Math.max(max, u.USER_ID), 0);
    await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: counterItem('ROOM', maxRoomId) }));
    await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: counterItem('USER', maxUserId) }));

    console.log(`移行完了。ID採番カウンタを ROOM=${maxRoomId}, USER=${maxUserId} に設定しました。`);
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error('移行に失敗しました:', error);
  process.exit(1);
});
