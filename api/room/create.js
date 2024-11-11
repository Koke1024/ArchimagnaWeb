// api/room/create.js
const db = require('/../../src/utils/knexfile');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const [roomId] = await db('ROOM_TBL').insert({ DAY: 0 });
      const room = await db('ROOM_TBL').select('*').where({ ROOM_ID: roomId });
      res.status(201).json(room[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
