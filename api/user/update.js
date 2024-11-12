const knex = require('../../knexfile.js'); // knex設定のインポート

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { ROOM_ID, USERS } = req.body;

    // 必須パラメータの確認
    if (!ROOM_ID || !USERS) {
        return res.status(400).json({ error: 'ROOM_ID and USERS are required' });
    }

    try {
        // `Promise.all` で全ユーザーの更新クエリを並列実行
        await Promise.all(
          Object.values(USERS).map((user) => {
              return knex('USER_TBL')
                .where({ USER_ID: user.USER_ID, ROOM_ID: ROOM_ID })
                .increment({
                    MANA: user.MANA,
                    HP: user.HP
                });
          })
        );

        // 更新後の`ROOM_TBL`の情報を取得
        const roomInfo = await knex('ROOM_TBL')
          .select('*')
          .where({ ROOM_ID })
          .first();

        // HPが0ではないユーザーのアクション記録を挿入
        await Promise.all(
          Object.values(USERS).map((user) => {
              if (user.HP === 0) {
                  return;
              }
              return knex('ACTION_TBL')
                .insert({
                    USER_ID: user.USER_ID,
                    ROOM_ID: ROOM_ID,
                    DAY: roomInfo.DAY,
                    ACTION_ID: 9,
                    ACTION_TARGET: `[${user.HP}]`
                });
          })
        );

        // MANAが0ではないユーザーのアクション記録を挿入
        await Promise.all(
          Object.values(USERS).map((user) => {
              if (user.MANA === 0) {
                  return;
              }
              return knex('ACTION_TBL')
                .insert({
                    USER_ID: user.USER_ID,
                    ROOM_ID: ROOM_ID,
                    DAY: roomInfo.DAY,
                    ACTION_ID: 10,
                    ACTION_TARGET: `[${user.MANA}]`
                });
          })
        );

        // 最終的なユーザー情報を取得して返す
        const updatedUsers = await knex('USER_TBL')
          .select('*')
          .where({ ROOM_ID });

        res.json(updatedUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Failed to update users', details: err.message });
    }
}
