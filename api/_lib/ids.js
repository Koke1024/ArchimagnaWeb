// api/_lib/ids.js
// MySQLのAUTO_INCREMENTに相当する数値IDを、DynamoDBのアトミックカウンタで払い出す。
// フロントエンドはROOM_ID/USER_IDを数値のままURLに埋め込んでいる（例: /pl/:roomId/:userId/:token）ため、
// TOKENとは別に数値IDを維持する必要がある。
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { doc, TABLE_NAME } = require('./dynamo.js');

// counterName: 'ROOM' | 'USER' のようにID空間ごとに独立したカウンタ名を渡す
async function nextId(counterName) {
  const result = await doc.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { PK: `COUNTER#${counterName}`, SK: `COUNTER#${counterName}` },
    UpdateExpression: 'ADD #v :incr',
    ExpressionAttributeNames: { '#v': 'Value' },
    ExpressionAttributeValues: { ':incr': 1 },
    ReturnValues: 'UPDATED_NEW',
  }));
  return result.Attributes.Value;
}

module.exports = { nextId };
