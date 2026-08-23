// api/room/next.js
const { getRoomById, updateRoomPhaseDay, computeNextPhase, computeBackPhase } = require('../_lib/rooms.js');
const { getActionsByRoom, deleteActions, pickPruneTargets } = require('../_lib/actions.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ROOM_ID, BACK } = req.body;

  if (!ROOM_ID) {
    return res.status(400).json({ error: 'ROOM_ID is required' });
  }

  try {
    const currentRoom = await getRoomById(ROOM_ID);

    if (BACK) {
      const { PHASE, DAY } = computeBackPhase(currentRoom);
      const updatedRoom = await updateRoomPhaseDay(ROOM_ID, { PHASE, DAY });
      res.json(updatedRoom);
      return;
    }

    const { PHASE, DAY } = computeNextPhase(currentRoom);
    const updatedRoom = await updateRoomPhaseDay(ROOM_ID, { PHASE, DAY });

    // ACTION_ID 5,7,8は各(USER_ID,DAY,ACTION_ID)グループごとに最新1件のみ残す
    // ACTION_ID 6は各グループごとに最新3件のみ残す
    const actions = await getActionsByRoom(ROOM_ID);
    const pruneTargets = [
      ...pickPruneTargets(actions, [5, 7, 8], 1),
      ...pickPruneTargets(actions, [6], 3),
    ];
    if (pruneTargets.length > 0) {
      await deleteActions(ROOM_ID, pruneTargets);
    }

    res.json(updatedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
