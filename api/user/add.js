// api/user/add.js
const db = require('/../../src/utils/knexfile');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { USER_NAMES, ROOM_ID } = req.body;
    if (!USER_NAMES || !ROOM_ID) return res.status(400).json({ error: 'USER_NAMES and ROOM_ID are required' });

    try {
      const users = USER_NAMES.map(name => ({ USER_NAME: name, ROOM_ID }));
      await db('USER_TBL').insert(users);
      const updatedUsers = await db('USER_TBL').select('*').where({ ROOM_ID });
      res.status(201).json(updatedUsers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
