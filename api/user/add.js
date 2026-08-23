// api/user/add.js
const { addUsers, getUsersByRoom } = require('../_lib/users.js');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { USER_NAMES, ROOM_ID } = req.body;
    if (!USER_NAMES || !ROOM_ID) return res.status(400).json({ error: 'USER_NAMES and ROOM_ID are required' });

    try {
      await addUsers(ROOM_ID, USER_NAMES);
      const updatedUsers = await getUsersByRoom(ROOM_ID);
      res.status(201).json(updatedUsers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
