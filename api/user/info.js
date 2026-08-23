// api/user/info.js
const { getUserByToken } = require('../_lib/users.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { USER_ID, TOKEN } = req.query;
    if (!USER_ID || !TOKEN) return res.status(400).json({ error: 'USER_ID and TOKEN are required' });

    try {
      const user = await getUserByToken(TOKEN);
      const result = (user && String(user.USER_ID) === String(USER_ID)) ? user : undefined;
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
