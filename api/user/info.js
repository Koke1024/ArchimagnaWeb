// api/user/info.js
const db = require('/../../src/utils/knexfile');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { USER_ID, TOKEN } = req.query;
    if (!USER_ID || !TOKEN) return res.status(400).json({ error: 'USER_ID and TOKEN are required' });

    try {
      const user = await db('USER_TBL').select('*').where({ USER_ID, TOKEN });
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
