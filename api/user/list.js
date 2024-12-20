// api/user/list.js
const db = require('../../knexfile.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { ROOM_ID, MASTER } = req.query;
    if (!ROOM_ID) return res.status(400).json({ error: 'ROOM_ID is required' });

    try {
      let users;
      if(MASTER){
        users = await db('USER_TBL').select('*').where({ ROOM_ID });
      }else{
        users = await db('USER_TBL').select('USER_ID', 'USER_NAME', 'USER_ORDER').where({ ROOM_ID });
      }
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
