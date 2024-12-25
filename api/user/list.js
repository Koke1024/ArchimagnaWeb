// api/user/list.js
const db = require('../../knexfile.js');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { ROOM_ID, TOKEN, MASTER } = req.query;
    if (!ROOM_ID) return res.status(400).json({ error: 'ROOM_ID is required' });

    try {
      let users;
      let teamMember = [];
      if(MASTER === "1"){
        users = await db('USER_TBL').select('*').where({ ROOM_ID });
      }else{
        let userTeam = await db('USER_TBL').select('TEAM').where({ TOKEN });
        console.log(userTeam)
        users = await db('USER_TBL').select('USER_ID', 'USER_NAME', 'USER_ORDER').where({ ROOM_ID });
        console.log(users)
        teamMember = await db('USER_TBL')
          .select('USER_ID', 'USER_NAME', 'USER_ORDER', 'TEAM')
          .where({ROOM_ID})
          .andWhere('TEAM', userTeam[0].TEAM);
        console.log(teamMember)
      }
      res.status(200).json({users: users, teams: teamMember});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
