const knex = require('../../knexfile.js'); // knexの設定ファイルをインポート

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ROOM_ID } = req.body;

  // 必須パラメータの確認
  if (!ROOM_ID) {
    return res.status(400).json({ error: 'ROOM_ID is required' });
  }

  try {
    // `PHASE` と `DAY` の更新処理
    await knex('ROOM_TBL')
      .where({ ROOM_ID })
      .update({
        PHASE: knex.raw(`
          CASE 
            WHEN PHASE = 7 OR DAY = 0 THEN 1 
            ELSE PHASE + 1 
          END
        `),
        DAY: knex.raw(`
          CASE 
            WHEN PHASE = 1 THEN DAY + 1 
            ELSE DAY 
          END
        `)
      });

    // 更新後のデータを取得して返す
    const updatedRoom = await knex('ROOM_TBL')
      .select('*')
      .where({ ROOM_ID })
      .first();

    res.json(updatedRoom);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}