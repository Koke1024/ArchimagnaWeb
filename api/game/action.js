// api/game/action.js
const { addAction } = require('../_lib/actions.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { USER_ID, ACTION_ID, TARGET, DAY, ROOM_ID } = req.body;

  if (!USER_ID || !ACTION_ID || !TARGET || !DAY || !ROOM_ID) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    await addAction(ROOM_ID, { ACTION_ID, USER_ID, ACTION_TARGET: TARGET, DAY });
    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Failed to insert action', details: error.message });
  }
}
