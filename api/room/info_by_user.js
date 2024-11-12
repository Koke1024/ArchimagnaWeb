// api/room/info_by_user.js
const db = require('../../knexfile.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { TOKEN, USER_ID } = req.query;
    if (!TOKEN || !USER_ID) {
      return res.status(400).json({ error: 'TOKEN and USER_ID are required' });
    }

    try {
      // サブクエリでユーザーのROOM_IDを取得し、そのROOM_IDに対応するルーム情報を取得します
      const room = await db('ROOM_TBL')
        .whereIn('ROOM_ID', function() {
          this.select('ROOM_ID')
            .from('USER_TBL')
            .where({ USER_ID, TOKEN });
        })
        .select('*');

      res.status(200).json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
