// api/_lib/dynamo.js
// DynamoDB DocumentClientのシングルトンを提供する。
//
// 注意: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION は
// AWS Lambdaの予約済み環境変数のため、VercelでこれらをVercel環境変数として
// 設定しても実行時にLambdaランタイム自身の値(Vercel内部のロール)で上書き
// されてしまい、意図した認証情報が使われない。そのため予約されていない
// DYNAMO_ACCESS_KEY_ID / DYNAMO_SECRET_ACCESS_KEY / DYNAMO_REGION を使い、
// 明示的に credentials として渡す(ローカル実行時にAWS CLIの標準環境変数
// (AWS_ACCESS_KEY_ID等)を使っている場合はそちらにフォールバックする)。
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const region = process.env.DYNAMO_REGION || process.env.AWS_REGION || 'ap-northeast-1';
const accessKeyId = process.env.DYNAMO_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.DYNAMO_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

const client = new DynamoDBClient({
  region,
  ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
});

// removeUndefinedValues: undefinedのフィールドを持つオブジェクトをそのままPutできるようにする
const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TABLE_NAME = process.env.DYNAMODB_TABLE || 'archimagna';
const GSI1_NAME = 'GSI1';

module.exports = { doc, TABLE_NAME, GSI1_NAME };
