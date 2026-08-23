// api/_lib/rooms.js
// ROOM_TBLに相当するデータアクセス層。
// PK=ROOM#{roomId}, SK=META のアイテムとしてルームを保持し、
// TOKENでの逆引き用にGSI1(GSI1PK=TOKEN#{token})を張る。
const crypto = require('crypto');
const { GetCommand, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { doc, TABLE_NAME, GSI1_NAME } = require('./dynamo.js');
const { nextId } = require('./ids.js');

function roomKey(roomId) {
  return { PK: `ROOM#${roomId}`, SK: 'META' };
}

// DynamoDBの内部アイテムをフロントエンドが期待するROOM_TBLの行形状に変換する
function toRoomDTO(item) {
  if (!item) return undefined;
  return { ROOM_ID: item.ROOM_ID, TOKEN: item.TOKEN, DAY: item.DAY, PHASE: item.PHASE };
}

async function createRoom() {
  const roomId = await nextId('ROOM');
  const token = crypto.randomUUID();
  const item = {
    ...roomKey(roomId),
    Type: 'ROOM',
    ROOM_ID: roomId,
    TOKEN: token,
    DAY: 0,
    PHASE: 0,
    GSI1PK: `TOKEN#${token}`,
    GSI1SK: `ROOM#${roomId}`,
  };
  await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return toRoomDTO(item);
}

async function getRoomById(roomId) {
  const result = await doc.send(new GetCommand({ TableName: TABLE_NAME, Key: roomKey(roomId) }));
  return toRoomDTO(result.Item);
}

async function getRoomByToken(token) {
  const result = await doc.send(new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: GSI1_NAME,
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: { ':pk': `TOKEN#${token}` },
    Limit: 1,
  }));
  const item = result.Items && result.Items[0];
  if (!item || item.Type !== 'ROOM') return undefined;
  return toRoomDTO(item);
}

async function updateRoomPhaseDay(roomId, { PHASE, DAY }) {
  const result = await doc.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: roomKey(roomId),
    UpdateExpression: 'SET PHASE = :p, DAY = :d',
    ExpressionAttributeValues: { ':p': PHASE, ':d': DAY },
    ReturnValues: 'ALL_NEW',
  }));
  return toRoomDTO(result.Attributes);
}

// 元のMySQL版はUPDATE文中のCASE式が更新前の行の値だけを参照する（1つのUPDATE文内では
// PHASE/DAYは互いに更新前の値のまま評価される）。ここでも同様に、常に更新前(oldPhase/oldDay)の
// 値だけを使って新PHASE・新DAYの両方を計算する。

// 「進める」ボタン: フェーズを1つ進め、外交フェーズ(PHASE=1)から抜けるタイミングでDAYを繰り上げる
function computeNextPhase({ PHASE: oldPhase, DAY: oldDay }) {
  const newPhase = (oldPhase === 7 || oldDay === 0) ? 1 : oldPhase + 1;
  const newDay = (oldPhase === 1) ? oldDay + 1 : oldDay;
  return { PHASE: newPhase, DAY: newDay };
}

// 「戻る」ボタン: フェーズを1つ戻し、戦闘フェーズ(PHASE=7)から戻るタイミングでDAYを繰り下げる
function computeBackPhase({ PHASE: oldPhase, DAY: oldDay }) {
  const newPhase = (oldDay === 0) ? 0 : (oldPhase === 1 ? 7 : oldPhase - 1);
  const newDay = (oldPhase === 7) ? oldDay - 1 : oldDay;
  return { PHASE: newPhase, DAY: newDay };
}

module.exports = {
  roomKey,
  toRoomDTO,
  createRoom,
  getRoomById,
  getRoomByToken,
  updateRoomPhaseDay,
  computeNextPhase,
  computeBackPhase,
};
