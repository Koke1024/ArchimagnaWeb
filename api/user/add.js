// api/user/add.js
const db = require('../../knexfile.js');

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { USER_NAMES, ROOM_ID } = req.body;
    if (!USER_NAMES || !ROOM_ID) return res.status(400).json({ error: 'USER_NAMES and ROOM_ID are required' });

    try {
      const users = USER_NAMES.map((name, index) => ({ USER_NAME: name, ROOM_ID, USER_ORDER: index }));
      console.log(db('USER_TBL').insert(users).toSQL())
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
