const crypto = require('crypto');
const rooms = {};
const playerTokens = new Map();
const socketToRoom = new Map();

function getRoom(roomId) {
  return rooms[roomId];
}

function createRoom(roomId, options = {}) {
  if (rooms[roomId]) return null;
  rooms[roomId] = {
    players: {},
    category: options.category || 'food',
    gameMode: options.gameMode || 'spy',
    maxPlayers: options.maxPlayers || 8,
    hostId: null,
    status: 'waiting',
    createdAt: Date.now(),
  };
  return rooms[roomId];
}

function addPlayer(roomId, socketId, nickname, isSpectator = false) {
  if (!rooms[roomId]) return false;
  if (Object.keys(rooms[roomId].players).length >= rooms[roomId].maxPlayers && !isSpectator) return false;
  const isFirst = Object.keys(rooms[roomId].players).length === 0;
  rooms[roomId].players[socketId] = {
    nickname,
    isSpectator,
    isHost: isFirst && !isSpectator,
  };
  if (isFirst && !isSpectator) rooms[roomId].hostId = socketId;
  socketToRoom.set(socketId, roomId);

  const token = crypto.randomBytes(16).toString('hex');
  playerTokens.set(token, { roomId, socketId, nickname, isSpectator, isHost: rooms[roomId].players[socketId].isHost });
  return token;
}

function removePlayer(socketId) {
  for (const [token, record] of playerTokens.entries()) {
    if (record.socketId === socketId) {
      playerTokens.delete(token);
      break;
    }
  }
  const roomId = socketToRoom.get(socketId);
  socketToRoom.delete(socketId);
  if (roomId && rooms[roomId]) {
    delete rooms[roomId].players[socketId];
    if (Object.keys(rooms[roomId].players).length === 0) {
      delete rooms[roomId];
    }
  }
}

function getNickname(roomId, socketId) {
  return rooms[roomId]?.players[socketId]?.nickname || '匿名';
}

function clearRoom(roomId) {
  if (rooms[roomId]) {
    rooms[roomId].status = 'ended';
    rooms[roomId].players = {};
  }
}

function getAllRooms() {
  return Object.entries(rooms).map(([id, room]) => ({
    id,
    playerCount: Object.keys(room.players).length,
    maxPlayers: room.maxPlayers,
    status: room.status,
    gameMode: room.gameMode,
    category: room.category,
  }));
}

function updateRoomStatus(roomId, status) {
  if (rooms[roomId]) {
    rooms[roomId].status = status;
  }
}

function reconnectPlayer(token, newSocketId) {
  const record = playerTokens.get(token);
  if (!record) return null;
  const { roomId, nickname, isSpectator, isHost } = record;
  const room = rooms[roomId];
  if (!room) return null;

  room.players[newSocketId] = { nickname, isSpectator, isHost };
  if (isHost) room.hostId = newSocketId;
  socketToRoom.set(newSocketId, roomId);
  record.socketId = newSocketId;

  return { roomId, nickname, isSpectator, isHost };
}

function getPlayerData(roomId, socketId) {
  return rooms[roomId]?.players[socketId] || null;
}

module.exports = {
  getRoom, createRoom, addPlayer, removePlayer, getNickname, clearRoom, getAllRooms, updateRoomStatus,
  reconnectPlayer, getPlayerData, playerTokens
};
