// api/_lib/actions.js
// ACTION_TBLに相当するデータアクセス層。
// PK=ROOM#{roomId}, SK=ACTION#{14桁ゼロ埋めタイムスタンプ}#{ランダム6桁} のアイテムとして行動ログを保持する。
// SKが時刻順に辞書式ソートされるため、Query結果は挿入順(古い順)で返る。
// フロントエンド(src/master.js)はfindLast()やslice(-3)で「末尾＝最新」を前提にしているため、
// この昇順を崩さないことが必須要件。
const crypto = require('crypto');
const { PutCommand, QueryCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { doc, TABLE_NAME } = require('./dynamo.js');

const TIMESTAMP_PAD = 14;

function actionSortKey(date) {
  const ts = date.getTime().toString().padStart(TIMESTAMP_PAD, '0');
  const rand = crypto.randomBytes(3).toString('hex');
  return `ACTION#${ts}#${rand}`;
}

// DynamoDBの内部アイテムをフロントエンドが期待するACTION_TBLの行形状に変換する。
// ACTION_LOG_IDはMySQLの自動採番PKに相当する一意識別子として、DynamoDBのSKをそのまま流用する。
function toActionDTO(item) {
  if (!item) return undefined;
  return {
    ACTION_LOG_ID: item.SK,
    ACTION_ID: item.ACTION_ID,
    USER_ID: item.USER_ID,
    ACTION_TARGET: item.ACTION_TARGET,
    DAY: item.DAY,
    ROOM_ID: item.ROOM_ID,
    UPD_DATE: item.UPD_DATE,
  };
}

async function addAction(roomId, { ACTION_ID, USER_ID, ACTION_TARGET, DAY }) {
  const now = new Date();
  const item = {
    PK: `ROOM#${roomId}`,
    SK: actionSortKey(now),
    Type: 'ACTION',
    ACTION_ID,
    USER_ID,
    ACTION_TARGET,
    DAY,
    ROOM_ID: roomId,
    UPD_DATE: now.toISOString(),
  };
  await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
  return toActionDTO(item);
}

async function getActionsByRoom(roomId) {
  const result = await doc.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `ROOM#${roomId}`, ':sk': 'ACTION#' },
  }));
  return (result.Items || []).map(toActionDTO);
}

// ACTION_LOG_ID(=SK)の配列を指定してまとめて削除する。
// BatchWriteItemは1リクエストあたり最大25件のため、超える場合はチャンク分割する。
async function deleteActions(roomId, actionLogIds) {
  const chunks = [];
  for (let i = 0; i < actionLogIds.length; i += 25) {
    chunks.push(actionLogIds.slice(i, i + 25));
  }
  for (const chunk of chunks) {
    await doc.send(new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: chunk.map((sk) => ({
          DeleteRequest: { Key: { PK: `ROOM#${roomId}`, SK: sk } },
        })),
      },
    }));
  }
}

// (USER_ID, DAY, ACTION_ID)ごとにグループ化し、指定したACTION_ID群の中で
// 各グループの最新keep件を残して、それ以外のACTION_LOG_IDを削除対象として返す。
// actionsは時系列昇順(古い順)で取得済みであることを前提とする。
function pickPruneTargets(actions, actionIds, keep) {
  const groups = new Map();
  for (const action of actions) {
    if (!actionIds.includes(action.ACTION_ID)) continue;
    const groupKey = `${action.USER_ID}#${action.DAY}#${action.ACTION_ID}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(action);
  }
  const targets = [];
  for (const group of groups.values()) {
    const excess = group.slice(0, Math.max(0, group.length - keep));
    targets.push(...excess.map((a) => a.ACTION_LOG_ID));
  }
  return targets;
}

module.exports = { addAction, getActionsByRoom, deleteActions, pickPruneTargets };
