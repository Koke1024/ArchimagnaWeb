// api/user/list.js
const { getUsersByRoom, getUserByToken } = require('../_lib/users.js');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const { ROOM_ID, TOKEN, MASTER } = req.query;
    if (!ROOM_ID) return res.status(400).json({ error: 'ROOM_ID is required' });

    try {
      const roomUsers = await getUsersByRoom(ROOM_ID);

      let users;
      let teamMember = [];
      if (MASTER === '1') {
        users = roomUsers;
      } else {
        const self = await getUserByToken(TOKEN);
        const myTeam = self ? self.TEAM : undefined;
        users = roomUsers.map(({ USER_ID, USER_NAME, USER_ORDER }) => ({ USER_ID, USER_NAME, USER_ORDER }));
        teamMember = roomUsers
          .filter((u) => u.TEAM === myTeam)
          .map(({ USER_ID, USER_NAME, USER_ORDER, TEAM }) => ({ USER_ID, USER_NAME, USER_ORDER, TEAM }));
      }
      res.status(200).json({ users, teams: teamMember });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
