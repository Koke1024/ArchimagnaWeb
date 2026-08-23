// scripts/create-table.js
//
// DynamoDBのシングルテーブルを作成するワンショットスクリプト。
// 課金を最小化するため BillingMode: PAY_PER_REQUEST (オンデマンド) を使用する。
//
// 実行方法:
//   AWS_REGION=ap-northeast-1 DYNAMODB_TABLE=archimagna node scripts/create-table.js
//
// テーブル設計 (シングルテーブル):
//   PK / SK              : プライマリキー
//     ROOM#{roomId} / META            ... ルーム情報
//     ROOM#{roomId} / USER#{userId}   ... ルームに属するユーザー
//     ROOM#{roomId} / ACTION#{ts}#{r} ... 行動ログ（SKが時刻順に辞書式ソートされる）
//     COUNTER#{name} / COUNTER#{name} ... ID採番用のアトミックカウンタ
//   GSI1 (GSI1PK / GSI1SK): TOKENからルーム/ユーザーを逆引きするためのスパースインデックス
//     TOKEN#{token} / ROOM#{roomId} または USER#{userId}
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE || 'archimagna';

const client = new DynamoDBClient({ region: REGION });

async function main() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`テーブル「${TABLE_NAME}」は既に存在するため作成をスキップしました。`);
    return;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') throw error;
  }

  await client.send(new CreateTableCommand({
    TableName: TABLE_NAME,
    BillingMode: 'PAY_PER_REQUEST',
    AttributeDefinitions: [
      { AttributeName: 'PK', AttributeType: 'S' },
      { AttributeName: 'SK', AttributeType: 'S' },
      { AttributeName: 'GSI1PK', AttributeType: 'S' },
      { AttributeName: 'GSI1SK', AttributeType: 'S' },
    ],
    KeySchema: [
      { AttributeName: 'PK', KeyType: 'HASH' },
      { AttributeName: 'SK', KeyType: 'RANGE' },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'GSI1',
        KeySchema: [
          { AttributeName: 'GSI1PK', KeyType: 'HASH' },
          { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
        ],
        Projection: { ProjectionType: 'ALL' },
      },
    ],
  }));

  console.log(`テーブル「${TABLE_NAME}」を作成しました(リージョン: ${REGION})。`);
}

main().catch((error) => {
  console.error('テーブル作成に失敗しました:', error);
  process.exit(1);
});
