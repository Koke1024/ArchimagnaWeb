// api/_lib/dynamo.js
// DynamoDB DocumentClientのシングルトンを提供する。
// Vercelサーバーレス関数はAWS内で実行されずIAMロールを持たないため、
// AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION を環境変数として設定する必要がある。
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-northeast-1',
});

// removeUndefinedValues: undefinedのフィールドを持つオブジェクトをそのままPutできるようにする
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'archimagna';
const GSI1_NAME = 'GSI1';

module.exports = { doc, TABLE_NAME, GSI1_NAME };
