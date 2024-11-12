const knex = require('../../../knexfile.js'); // knexの設定ファイルをインポート

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ROOM_ID } = req.body;

  // 必須パラメータの確認
  if (!ROOM_ID) {
    return res.status(400).json({ error: 'ROOM_ID is required' });
  }

  // シャッフル関数
  const shuffleArray = arr => arr.sort(() => Math.random() - 0.5);

  // チームとパートナーロールのリストを準備
  let team = [[1, 1], [1, 0], [2, 1], [2, 0], [3, 1], [3, 0], [4, 1], [4, 0]];
  let partnerRoleList = [5, 6, 7, 8];

  // シャッフル
  team = shuffleArray(team);
  partnerRoleList = shuffleArray(partnerRoleList);

  try {
    // ユーザーを取得
    const rows = await knex('USER_TBL').select('USER_ID').where({ ROOM_ID });

    if (rows.length !== 8) {
      return res.status(400).json({ error: `ルームメンバーが8人でない(${rows.length}人)` });
    }

    // 更新クエリの準備と実行
    const updatePromises = rows.map((row, i) => {
      return knex('USER_TBL')
        .update({
          TEAM: team[i][0],
          ROLE: team[i][1] === 1 ? team[i][0] : partnerRoleList.pop()
        })
        .where({ USER_ID: row.USER_ID });
    });

    // 全ての更新クエリを実行
    await Promise.all(updatePromises);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}