const knex = require('../../knexfile.js'); // knex設定のインポート

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { USER_ID, ACTION_ID, TARGET, DAY, ROOM_ID } = req.body;

  // 必須パラメータの確認
  if (!USER_ID || !ACTION_ID || !TARGET || !DAY || !ROOM_ID) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // `ACTION_TBL`にデータを挿入
    await knex('ACTION_TBL').insert({
      ACTION_ID,
      USER_ID,
      ACTION_TARGET: TARGET,
      DAY,
      ROOM_ID
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to insert action', details: error.message });
  }
}
