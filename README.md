# ArchiMagna GM進行補助ツールの使い方

https://archimagna-web.vercel.app

にブラウザでアクセスします。
新規ルームの作成を選び、表示される画面に、
参加するプレイヤーキャラクター（PC名）を
入力し、「プレイヤー名登録」を選択します。

「ロールの自動割り当て」をクリックすると、
各プレイヤーの陣営、精霊がランダムで
割り当てられます。
必要に応じて再割り当てが可能です。

各プレイヤー名の横にある
アイコンをクリックすると、
各プレイヤー用ページの
URLがクリップボードにコピーされます。

画面右下の「開始」を押すとゲームが開始され、
ゲームの進行に応じて、「進める」
を押してフェイズを進めます。

外交～陣営会議、裁定、呼剥、戦闘
それぞれのフェイズが終わるたび、
対応するフィールドをコピーして
GM用Spreadsheetに貼り付けます。
例として、Q3～Z10の場合は、
シートのQ3セルを選択して貼り付けます。


# ArchiMagna PL進行補助ツールの使い方


GMから送られるURLにアクセスします。
フェイズの進行に合わせて「情報更新」ボタンを
クリックすることでフェイズが進行し、
フェイズに合わせたアクションを選択できるようになります。

アクションを選択してから、
対象選択ボタン
によってアクションの内容を選択し、
赤いボタンをクリックして確定します。
アクションによっては複数の項目を選ぶ必要があります。
「AがBとの戦闘に勝利した」など、
選択の順番が重要なアクションもあるので、送信する文章が正しくなっているか確認してください。


命約、使い魔では文章の入力が必要です。

裁定、攻撃は、同じフェイズ中であれば、
後から送った内容が有効になります。
呼剥では、後に送った3つが有効になります。

なお、ブラウザのページ翻訳が有効になっている場合、
無効にして利用してください。


# 開発者向け: バックエンド構成

本ツールのバックエンド（`api/`配下のVercel Serverless Functions）は、
MySQL(RDS)からAWS DynamoDBへ移行済みです。DynamoDBはオンデマンド課金
(PAY_PER_REQUEST)のため、本ツールのような低頻度・セッション単位の
利用パターンでは、常時起動が必要なRDSに比べて運用コストを大幅に
抑えられます。

## 必要な環境変数

Vercelのプロジェクト設定（Environment Variables）に以下を追加してください。
AWSはIAMロールではなくアクセスキーで認証するため、`DYNAMO_ACCESS_KEY_ID` /
`DYNAMO_SECRET_ACCESS_KEY` の設定が必須です。

> **重要**: `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` という
> 名前は**使わないでください**。これらはAWS Lambdaの予約済み環境変数のため、
> Vercel（Lambda上で動作）でこの名前を設定しても実行時にLambdaランタイム
> 自身の値（Vercel内部のロール）で上書きされてしまい、意図した認証情報が
> 一切使われません。そのため、予約されていない `DYNAMO_` 接頭辞の変数名を
> 使用します。

| 変数名 | 説明 | 例 |
| --- | --- | --- |
| `DYNAMO_REGION` | DynamoDBテーブルのリージョン | `ap-northeast-1` |
| `DYNAMODB_TABLE` | 使用するテーブル名 | `archimagna` |
| `DYNAMO_ACCESS_KEY_ID` | DynamoDBへのアクセスを許可するIAMユーザーのアクセスキー | - |
| `DYNAMO_SECRET_ACCESS_KEY` | 上記アクセスキーのシークレット | - |

IAMユーザーには対象テーブルおよびそのGSIに対する
`dynamodb:GetItem` / `PutItem` / `UpdateItem` / `Query` / `BatchWriteItem`
権限を付与してください。ルートアカウントのアクセスキーは使わず、
以下の最小権限ポリシーを持つ専用IAMユーザーを作成することを推奨します。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-northeast-1:970547380183:table/archimagna",
        "arn:aws:dynamodb:ap-northeast-1:970547380183:table/archimagna/index/*"
      ]
    }
  ]
}
```

作成手順（AWSコンソール）:
1. IAM > ユーザー > ユーザーを作成 で `archimagna-dynamodb-app` などの名前で作成
2. 「アクセスキー」を発行（用途: アプリケーション実行時のプログラムアクセス）
3. 上記JSONをインラインポリシーとしてアタッチ
4. 発行されたアクセスキーを、Vercelの環境変数 `DYNAMO_ACCESS_KEY_ID` /
   `DYNAMO_SECRET_ACCESS_KEY` に設定（`AWS_ACCESS_KEY_ID` 等ではないので注意）

## テーブルの作成

初回のみ、以下のスクリプトでテーブル（オンデマンド課金、GSI1付き）を作成します。

```
AWS_REGION=ap-northeast-1 DYNAMODB_TABLE=archimagna node scripts/create-table.js
```

## 既存MySQLデータの移行

旧RDS環境にデータが残っている場合、以下のスクリプトで一度だけ
DynamoDBへ移行できます（`mysql2`は移行時のみ一時的に必要です）。

```
npm install --no-save mysql2
REACT_APP_DB_HOST=... REACT_APP_DB_USER=... REACT_APP_DB_PASSWORD=... REACT_APP_DB_NAME=... \
AWS_REGION=ap-northeast-1 DYNAMODB_TABLE=archimagna \
node scripts/migrate-mysql-to-dynamo.js
```

移行および動作確認が完了したら、RDSインスタンスは削除して問題ありません
（本移行の主目的である、常時課金の解消につながります）。