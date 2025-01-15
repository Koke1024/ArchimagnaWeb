const knex = require('../../knexfile.js'); // knexの設定ファイルをインポート

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ROOM_ID, BACK } = req.body;

  // 必須パラメータの確認
  if (!ROOM_ID) {
    return res.status(400).json({ error: 'ROOM_ID is required' });
  }

  try {
    if(BACK){
      // `PHASE` と `DAY` の更新処理
      await knex('ROOM_TBL')
        .where({ ROOM_ID })
        .update({
          PHASE: knex.raw(`
          CASE 
            WHEN DAY = 0 THEN 0
            WHEN PHASE = 1 THEN 7 
            ELSE PHASE - 1 
          END
        `),
          DAY: knex.raw(`
          CASE 
            WHEN PHASE = 7 THEN DAY - 1 
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
      return;
    }
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

    // ACTION_IDが5,6,7の場合、最新を残して削除
    await knex.raw(`
        DELETE
        FROM ACTION_TBL
        WHERE ACTION_LOG_ID NOT IN (SELECT *
          FROM (SELECT MAX(ACTION_LOG_ID)
                FROM ACTION_TBL
                WHERE ROOM_ID = ?
                  AND ACTION_ID IN (5, 7, 8)
                GROUP BY ROOM_ID, USER_ID, DAY, ACTION_ID) AS latest)
          AND ROOM_ID = ?
          AND ACTION_ID IN (5, 7, 8);
      `, [ROOM_ID, ROOM_ID]);

    // ACTION_IDが6の場合、最新3つを残して削除
    await knex.raw(`
        DELETE
        FROM ACTION_TBL
        WHERE ACTION_LOG_ID NOT IN (SELECT *
            FROM (SELECT ACTION_LOG_ID
                  FROM (SELECT ACTION_LOG_ID,
                               ROW_NUMBER() OVER (
           PARTITION BY ROOM_ID, USER_ID, DAY, ACTION_ID 
           ORDER BY UPD_DATE DESC
         ) AS rn
                  FROM ACTION_TBL
                  WHERE ROOM_ID = ?
                    AND ACTION_ID = 6) ranked
            WHERE rn <= 3) AS latest)
          AND ROOM_ID = ?
          AND ACTION_ID = 6;
      `, [ROOM_ID, ROOM_ID]);

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