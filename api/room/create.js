// api/room/create.js
const { createRoom } = require('../_lib/rooms.js');

module.exports = async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const room = await createRoom();
      res.status(201).json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
