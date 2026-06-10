const games = new Map();

function initGame(roomId, playersMap, civilianWord, spyWord) {
  const players = {};
  const playerIds = Object.keys(playersMap).filter(id => !playersMap[id].isSpectator);
  const spyIndices = new Set();
  const spyNum = Math.max(1, Math.floor(playerIds.length / 3));

  while (spyIndices.size < spyNum) {
    spyIndices.add(Math.floor(Math.random() * playerIds.length));
  }

  playerIds.forEach((id, idx) => {
    const isSpy = spyIndices.has(idx);
    players[id] = {
      nickname: playersMap[id].nickname,
      isSpy,
      word: isSpy ? spyWord : civilianWord,
      alive: true,
      description: null,
      voteTarget: null,
    };
  });

  games.set(roomId, {
    round: 1,
    players,
    civilianWord,
    spyWord,
    currentPhase: 'description',
    descriptionCount: 0,
    voteCount: 0,
  });
}

function getGameState(roomId) { return games.get(roomId); }

function submitDescription(roomId, socketId, text) {
  const game = games.get(roomId);
  if (!game || game.currentPhase !== 'description') return false;
  if (game.players[socketId] && game.players[socketId].alive && !game.players[socketId].description) {
    game.players[socketId].description = text;
    game.descriptionCount++;
    return true;
  }
  return false;
}

function allDescriptionsIn(roomId) {
  const game = games.get(roomId);
  const aliveCount = Object.values(game.players).filter(p => p.alive).length;
  return game.descriptionCount === aliveCount;
}

function getAllDescriptions(roomId) {
  const game = games.get(roomId);
  const descs = [];
  for (const [id, p] of Object.entries(game.players)) {
    if (p.alive) descs.push({ id, nickname: p.nickname, desc: p.description });
  }
  return descs;
}

function submitVote(roomId, voterId, targetId) {
  const game = games.get(roomId);
  if (!game || game.currentPhase !== 'voting') return false;
  if (game.players[voterId]?.alive && !game.players[voterId].voteTarget) {
    game.players[voterId].voteTarget = targetId;
    game.voteCount++;
    return true;
  }
  return false;
}

function allVotesIn(roomId) {
  const game = games.get(roomId);
  const aliveCount = Object.values(game.players).filter(p => p.alive).length;
  return game.voteCount === aliveCount;
}

function resolveVote(roomId) {
  const game = games.get(roomId);
  const voteMap = new Map();
  for (const p of Object.values(game.players)) {
    if (p.alive && p.voteTarget) {
      voteMap.set(p.voteTarget, (voteMap.get(p.voteTarget) || 0) + 1);
    }
  }
  let maxVotes = -1, eliminated = null;
  for (const [id, count] of voteMap) {
    if (count > maxVotes) {
      maxVotes = count;
      eliminated = id;
    }
  }
  if (eliminated) game.players[eliminated].alive = false;
  for (const p of Object.values(game.players)) {
    p.description = null;
    p.voteTarget = null;
  }
  game.descriptionCount = 0;
  game.voteCount = 0;
  game.currentPhase = 'description';
  return eliminated;
}

function checkWinner(roomId) {
  const game = games.get(roomId);
  const aliveSpies = Object.values(game.players).filter(p => p.alive && p.isSpy).length;
  const aliveCivilians = Object.values(game.players).filter(p => p.alive && !p.isSpy).length;
  if (aliveSpies === 0) return 'civilian';
  if (aliveCivilians <= aliveSpies) return 'spy';
  return null;
}

function nextRound(roomId) {
  const game = games.get(roomId);
  game.round++;
}

function getCurrentRound(roomId) {
  return games.get(roomId).round;
}

module.exports = {
  initGame, getGameState, submitDescription, allDescriptionsIn, getAllDescriptions,
  submitVote, allVotesIn, resolveVote, checkWinner, nextRound, getCurrentRound
};
