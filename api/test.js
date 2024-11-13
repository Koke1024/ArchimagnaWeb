// api/test.js
const db = require('../knexfile.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const rooms = db('ROOM_TBL').select("*")
      res.status(200).json(rooms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
