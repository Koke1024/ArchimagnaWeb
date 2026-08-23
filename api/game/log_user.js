// api/game/log_user.js
const { getActionsByRoom } = require('../_lib/actions.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { ROOM_ID, USER_ID } = req.query;
    if (!ROOM_ID || !USER_ID) return res.status(400).json({ error: 'ROOM_ID and USER_ID are required' });

    try {
      const logs = (await getActionsByRoom(ROOM_ID))
        .filter((log) => String(log.USER_ID) === String(USER_ID) && ![9, 10].includes(log.ACTION_ID));
      res.status(200).json(logs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
