// api/game/log.js
const db = require('/../../src/utils/knexfile');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { ROOM_ID } = req.query;
    if (!ROOM_ID) return res.status(400).json({ error: 'ROOM_ID is required' });

    try {
      const logs = await db('ACTION_TBL').select('*').where({ ROOM_ID });
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
