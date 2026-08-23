// api/_lib/users.js
// USER_TBLに相当するデータアクセス層。
// PK=ROOM#{roomId}, SK=USER#{userId(ゼロ埋め)} のアイテムとしてユーザーを保持する。
// SKをゼロ埋めするのは、同一ルーム内でQueryした際にUSER_ORDERに依らず
// USER_IDの昇順で安定して返すため。
const crypto = require('crypto');
const { GetCommand, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { doc, TABLE_NAME, GSI1_NAME } = require('./dynamo.js');
const { nextId } = require('./ids.js');

const DEFAULT_HP = 3;
const USER_ID_PAD = 10;

function userKey(roomId, userId) {
  return { PK: `ROOM#${roomId}`, SK: `USER#${String(userId).padStart(USER_ID_PAD, '0')}` };
}

// DynamoDBの内部アイテムをフロントエンドが期待するUSER_TBLの行形状に変換する
function toUserDTO(item) {
  if (!item) return undefined;
  return {
    USER_ID: item.USER_ID,
    USER_NAME: item.USER_NAME,
    ROOM_ID: item.ROOM_ID,
    USER_ORDER: item.USER_ORDER,
    TOKEN: item.TOKEN,
    TEAM: item.TEAM,
    ROLE: item.ROLE,
    MANA: item.MANA,
    HP: item.HP,
  };
}

// namesの並び順どおりにUSER_ORDERを採番して一括作成する
async function addUsers(roomId, names) {
  const items = [];
  for (let i = 0; i < names.length; i++) {
    const userId = await nextId('USER');
    const token = crypto.randomUUID();
    items.push({
      ...userKey(roomId, userId),
      Type: 'USER',
      USER_ID: userId,
      USER_NAME: names[i],
      ROOM_ID: roomId,
      USER_ORDER: i,
      TOKEN: token,
      TEAM: null,
      ROLE: null,
      MANA: 0,
      HP: DEFAULT_HP,
      GSI1PK: `TOKEN#${token}`,
      GSI1SK: `USER#${userId}`,
    });
  }
  // 参加人数は最大8名程度のため並列PutItemで十分
  await Promise.all(items.map((item) => doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))));
  return items.map(toUserDTO);
}

async function getUserById(roomId, userId) {
  const result = await doc.send(new GetCommand({ TableName: TABLE_NAME, Key: userKey(roomId, userId) }));
  return toUserDTO(result.Item);
}

async function getUsersByRoom(roomId) {
  const result = await doc.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `ROOM#${roomId}`, ':sk': 'USER#' },
  }));
  return (result.Items || []).map(toUserDTO);
}

async function getUserByToken(token) {
  const result = await doc.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': `TOKEN#${token}` },
    Limit: 1,
  }));
  const item = result.Items && result.Items[0];
  if (!item || item.Type !== 'USER') return undefined;
  return toUserDTO(item);
}

async function updateUserRole(roomId, userId, { TEAM, ROLE }) {
  await doc.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: userKey(roomId, userId),
    UpdateExpression: 'SET TEAM = :team, ROLE = :role',
    ExpressionAttributeValues: { ':team': TEAM, ':role': ROLE },
  }));
}

// MANA/HPをMySQLのincrement()相当でアトミックに加算する（負値で減算も可）
async function incrementUserStats(roomId, userId, { MANA = 0, HP = 0 }) {
  const result = await doc.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: userKey(roomId, userId),
    UpdateExpression: 'ADD MANA :mana, HP :hp',
    ExpressionAttributeValues: { ':mana': MANA, ':hp': HP },
    ReturnValues: 'ALL_NEW',
  }));
  return toUserDTO(result.Attributes);
}

module.exports = {
  userKey,
  toUserDTO,
  addUsers,
  getUserById,
  getUsersByRoom,
  getUserByToken,
  updateUserRole,
  incrementUserStats,
};
