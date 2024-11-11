// api/room/info.js
const db = require('/../../src/utils/knexfile');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { TOKEN } = req.query;
    if (!TOKEN) return res.status(400).json({ error: 'TOKEN is required' });

    try {
      const room = await db('ROOM_TBL').select('*').where({ TOKEN });
      res.status(200).json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
