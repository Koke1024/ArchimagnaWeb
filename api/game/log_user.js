// api/game/log_user.js
const db = require('../../knexfile.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { ROOM_ID, USER_ID } = req.query;
    if (!ROOM_ID || !USER_ID) return res.status(400).json({ error: 'ROOM_ID and USER_ID are required' });

    try {
      const logs = await db('ACTION_TBL').select('*')
        .where({ ROOM_ID, USER_ID })
        .whereNotIn('ACTION_ID', [9, 10]);
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
