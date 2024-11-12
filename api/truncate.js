// api/truncate.js
const db = require('../knexfile.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      await db('ROOM_TBL').truncate();
      await db('ACTION_TBL').truncate();
      await db('USER_TBL').truncate();
      res.status(200).json({ message: 'All tables truncated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
