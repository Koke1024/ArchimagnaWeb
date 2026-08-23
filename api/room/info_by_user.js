// api/room/info_by_user.js
const { getUserByToken } = require('../_lib/users.js');
const { getRoomById } = require('../_lib/rooms.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { TOKEN, USER_ID } = req.query;
    if (!TOKEN || !USER_ID) {
      return res.status(400).json({ error: 'TOKEN and USER_ID are required' });
    }

    try {
      // TOKENでユーザーを特定し、USER_IDが一致することを確認したうえで所属ルームを取得する
      const user = await getUserByToken(TOKEN);
      if (!user || String(user.USER_ID) !== String(USER_ID)) {
        return res.status(200).json(undefined);
      }

      const room = await getRoomById(user.ROOM_ID);
      res.status(200).json(room);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
