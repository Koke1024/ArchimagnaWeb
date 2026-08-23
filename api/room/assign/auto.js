// api/room/assign/auto.js
const { getUsersByRoom, updateUserRole } = require('../../_lib/users.js');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ROOM_ID } = req.body;

  if (!ROOM_ID) {
    return res.status(400).json({ error: 'ROOM_ID is required' });
  }

  // シャッフル関数
  const shuffleArray = (arr) => arr.sort(() => Math.random() - 0.5);

  // チームとパートナーロールのリストを準備
  let team = [[1, 1], [1, 0], [2, 1], [2, 0], [3, 1], [3, 0], [4, 1], [4, 0]];
  let partnerRoleList = [5, 6, 7, 8];

  team = shuffleArray(team);
  partnerRoleList = shuffleArray(partnerRoleList);

  try {
    const users = await getUsersByRoom(ROOM_ID);

    if (users.length !== 8) {
      return res.status(400).json({ error: `ルームメンバーが8人でない(${users.length}人)` });
    }

    const updatePromises = users.map((user, i) => updateUserRole(ROOM_ID, user.USER_ID, {
      TEAM: team[i][0],
      ROLE: team[i][1] === 1 ? team[i][0] : partnerRoleList.pop(),
    }));

    await Promise.all(updatePromises);

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
