// api/user/update.js
const { incrementUserStats, getUsersByRoom } = require('../_lib/users.js');
const { getRoomById } = require('../_lib/rooms.js');
const { addAction } = require('../_lib/actions.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ROOM_ID, USERS } = req.body;

  if (!ROOM_ID || !USERS) {
    return res.status(400).json({ error: 'ROOM_ID and USERS are required' });
  }

  try {
    const userList = Object.values(USERS);

    await Promise.all(
      userList.map((user) => incrementUserStats(ROOM_ID, user.USER_ID, { MANA: user.MANA, HP: user.HP }))
    );

    const roomInfo = await getRoomById(ROOM_ID);

    // HPが0でないユーザーはHP操作(ACTION_ID:9)のログを記録
    await Promise.all(
      userList.map((user) => {
        if (user.HP === 0) return undefined;
        return addAction(ROOM_ID, {
          ACTION_ID: 9,
          USER_ID: user.USER_ID,
          ACTION_TARGET: `[${user.HP}]`,
          DAY: roomInfo.DAY,
        });
      })
    );

    // MANAが0でないユーザーは魔力操作(ACTION_ID:10)のログを記録
    await Promise.all(
      userList.map((user) => {
        if (user.MANA === 0) return undefined;
        return addAction(ROOM_ID, {
          ACTION_ID: 10,
          USER_ID: user.USER_ID,
          ACTION_TARGET: `[${user.MANA}]`,
          DAY: roomInfo.DAY,
        });
      })
    );

    const updatedUsers = await getUsersByRoom(ROOM_ID);
    res.json(updatedUsers);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to update users', details: err.message });
  }
}
