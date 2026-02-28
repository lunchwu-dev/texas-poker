/**
 * 德州扑克游戏服务器
 * 负责处理游戏房间、玩家连接、游戏逻辑控制
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// 游戏常量
const MAX_PLAYERS_PER_TABLE = 6;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const STARTING_CHIPS = 1000;

// 存储数据
const rooms = new Map(); // roomId -> room data
const players = new Map(); // socketId -> player data

// 德州扑克牌型定义
const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// 生成一副牌
function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, value: getCardValue(rank) });
    }
  }
  return shuffleDeck(deck);
}

// 洗牌
function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// 获取牌面值
function getCardValue(rank) {
  const index = RANKS.indexOf(rank);
  return index + 2;
}

// 创建房间
function createRoom(roomName, password = '') {
  const roomId = uuidv4().substring(0, 8).toUpperCase();
  const room = {
    id: roomId,
    name: roomName,
    password,
    players: [],
    deck: [],
    communityCards: [],
    pot: 0,
    currentBet: 0,
    dealerPosition: 0,
    currentPlayerIndex: 0,
    gameState: 'waiting', // waiting, preflop, flop, turn, river, showdown
    stage: 'waiting',
    stats: {} // room statistics
  };
  rooms.set(roomId, room);
  return room;
}

// 发牌给玩家
function dealCards(room) {
  room.deck = createDeck();
  room.players.forEach(player => {
    player.cards = [room.deck.pop(), room.deck.pop()];
    player.chips = STARTING_CHIPS;
    player.currentBet = 0;
    player.folded = false;
    player.allIn = false;
    player.lastAction = null;
  });
}

// 下注
function bet(player, amount) {
  if (amount > player.chips) {
    amount = player.chips;
    player.allIn = true;
  }
  player.chips -= amount;
  player.currentBet += amount;
  return amount;
}

// 比较牌型
function evaluateHand(playerCards, communityCards) {
  const allCards = [...playerCards, ...communityCards];
  const hand = findBestHand(allCards);
  return hand;
}

// 找到最佳牌型
function findBestHand(cards) {
  if (cards.length < 5) return null;
  
  const combinations = getCombinations(cards, 5);
  let bestHand = null;
  let bestScore = 0;
  
  for (const combo of combinations) {
    const score = evaluate5CardHand(combo);
    if (score > bestScore) {
      bestScore = score;
      bestHand = { cards: combo, score, type: getHandType(score) };
    }
  }
  
  return bestHand;
}

// 获取所有5张牌组合
function getCombinations(cards, k) {
  if (k === 0) return [[]];
  if (cards.length === 0) return [];
  
  const first = cards[0];
  const rest = cards.slice(1);
  
  const combsWithoutFirst = getCombinations(rest, k);
  const combsWithFirst = getCombinations(rest, k - 1).map(c => [first, ...c]);
  
  return [...combsWithoutFirst, ...combsWithFirst];
}

// 评估5张牌的牌型得分
function evaluate5CardHand(cards) {
  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const isFlush = sorted.every(c => c.suit === sorted[0].suit);
  const isStraight = checkStraight(sorted);
  
  // 统计相同牌面
  const counts = {};
  sorted.forEach(c => {
    counts[c.value] = (counts[c.value] || 0) + 1;
  });
  const countValues = Object.values(counts).sort((a, b) => b - a);
  
  let score = 0;
  
  // 皇家同花顺
  if (isFlush && isStraight && sorted[0].value === 14) {
    score = 9000000000000 + getHighCardScore(sorted);
  }
  // 同花顺
  else if (isFlush && isStraight) {
    score = 8000000000000 + getHighCardScore(sorted);
  }
  // 四条
  else if (countValues[0] === 4) {
    score = 7000000000000 + getFourOfAKindScore(counts, sorted);
  }
  // 葫芦
  else if (countValues[0] === 3 && countValues[1] === 2) {
    score = 6000000000000 + getFullHouseScore(counts, sorted);
  }
  // 同花
  else if (isFlush) {
    score = 5000000000000 + getHighCardScore(sorted);
  }
  // 顺子
  else if (isStraight) {
    score = 4000000000000 + getHighCardScore(sorted);
  }
  // 三条
  else if (countValues[0] === 3) {
    score = 3000000000000 + getThreeOfAKindScore(counts, sorted);
  }
  // 两对
  else if (countValues[0] === 2 && countValues[1] === 2) {
    score = 2000000000000 + getTwoPairScore(counts, sorted);
  }
  // 一对
  else if (countValues[0] === 2) {
    score = 1000000000000 + getOnePairScore(counts, sorted);
  }
  // 高牌
  else {
    score = getHighCardScore(sorted);
  }
  
  return score;
}

// 检查顺子
function checkStraight(sorted) {
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].value - sorted[i + 1].value !== 1) {
      // 检查A-2-3-4-5特殊情况
      if (i === 3) {
        const values = sorted.map(c => c.value);
        if (values.join(',') === '14,5,4,3,2') return true;
      }
      return false;
    }
  }
  return true;
}

// 获取牌型名称
function getHandType(score) {
  if (score >= 9000000000000) return '皇家同花顺';
  if (score >= 8000000000000) return '同花顺';
  if (score >= 7000000000000) return '四条';
  if (score >= 6000000000000) return '葫芦';
  if (score >= 5000000000000) return '同花';
  if (score >= 4000000000000) return '顺子';
  if (score >= 3000000000000) return '三条';
  if (score >= 2000000000000) return '两对';
  if (score >= 1000000000000) return '一对';
  return '高牌';
}

// 各种牌型得分计算
function getHighCardScore(sorted) {
  let score = 0;
  sorted.forEach((c, i) => {
    score += c.value * Math.pow(100, 4 - i);
  });
  return score;
}

function getFourOfAKindScore(counts, sorted) {
  const fourValue = parseInt(Object.keys(counts).find(k => counts[k] === 4));
  const kicker = parseInt(Object.keys(counts).find(k => counts[k] === 1));
  return fourValue * 100 + kicker;
}

function getFullHouseScore(counts, sorted) {
  const threeValue = parseInt(Object.keys(counts).find(k => counts[k] === 3));
  const twoValue = parseInt(Object.keys(counts).find(k => counts[k] === 2));
  return threeValue * 100 + twoValue;
}

function getThreeOfAKindScore(counts, sorted) {
  const threeValue = parseInt(Object.keys(counts).find(k => counts[k] === 3));
  const kickers = Object.keys(counts).filter(k => counts[k] === 1).map(Number).sort((a, b) => b - a);
  return threeValue * 10000 + kickers[0] * 100 + kickers[1];
}

function getTwoPairScore(counts, sorted) {
  const pairs = Object.keys(counts).filter(k => counts[k] === 2).map(Number).sort((a, b) => b - a);
  const kicker = parseInt(Object.keys(counts).find(k => counts[k] === 1));
  return pairs[0] * 10000 + pairs[1] * 100 + kicker;
}

function getOnePairScore(counts, sorted) {
  const pairValue = parseInt(Object.keys(counts).find(k => counts[k] === 2));
  const kickers = Object.keys(counts).filter(k => counts[k] === 1).map(Number).sort((a, b) => b - a);
  return pairValue * 1000000 + kickers[0] * 10000 + kickers[1] * 100 + kickers[2];
}

// 确定获胜者
function determineWinner(room) {
  const activePlayers = room.players.filter(p => !p.folded);
  
  if (activePlayers.length === 1) {
    return [activePlayers[0]];
  }
  
  const results = activePlayers.map(player => {
    const hand = evaluateHand(player.cards, room.communityCards);
    return { player, hand };
  });
  
  results.sort((a, b) => b.hand.score - a.hand.score);
  
  const winners = [results[0].player];
  for (let i = 1; i < results.length; i++) {
    if (results[i].hand.score === results[0].hand.score) {
      winners.push(results[i].player);
    } else {
      break;
    }
  }
  
  return winners;
}

// 分配底池
function distributePot(room, winners) {
  const pot = room.pot;
  const winAmount = Math.floor(pot / winners.length);
  
  winners.forEach(w => {
    w.chips += winAmount;
  });
  
  return winAmount;
}

// 获取下一个行动玩家
function getNextPlayer(room) {
  const activePlayers = room.players.filter(p => !p.folded && !p.allIn);
  if (activePlayers.length <= 1) return null;
  
  let attempts = 0;
  let index = room.currentPlayerIndex;
  
  while (attempts < room.players.length) {
    index = (index + 1) % room.players.length;
    const player = room.players[index];
    if (!player.folded && !player.allIn && player.chips > 0) {
      room.currentPlayerIndex = index;
      return player;
    }
    attempts++;
  }
  
  return null;
}

// 检查当前回合是否结束
function isRoundComplete(room) {
  const activePlayers = room.players.filter(p => !p.folded && !p.allIn);
  if (activePlayers.length <= 1) return true;
  
  const bets = activePlayers.map(p => p.currentBet);
  const maxBet = Math.max(...bets);
  
  return activePlayers.every(p => p.currentBet === maxBet || p.chips === 0);
}

// 进入下一阶段
function nextStage(room) {
  room.communityCards = [];
  room.currentBet = 0;
  room.players.forEach(p => p.currentBet = 0);
  
  const stage = room.gameState;
  
  switch (stage) {
    case 'preflop':
      room.communityCards = [room.deck.pop(), room.deck.pop(), room.deck.pop()];
      room.gameState = 'flop';
      break;
    case 'flop':
      room.communityCards.push(room.deck.pop());
      room.gameState = 'turn';
      break;
    case 'turn':
      room.communityCards.push(room.deck.pop());
      room.gameState = 'river';
      break;
    case 'river':
      room.gameState = 'showdown';
      const winners = determineWinner(room);
      const winAmount = distributePot(room, winners);
      
      // 更新统计数据
      room.stats.totalGames = (room.stats.totalGames || 0) + 1;
      winners.forEach(w => {
        w.stats.wins = (w.stats.wins || 0) + 1;
      });
      
      io.to(room.id).emit('gameShowdown', {
        communityCards: room.communityCards,
        winners: winners.map(w => ({ id: w.id, name: w.name, winAmount })),
        playerHands: room.players.map(p => ({
          id: p.id,
          name: p.name,
          cards: p.cards,
          hand: p.folded ? null : evaluateHand(p.cards, room.communityCards)
        }))
      });
      
      // 5秒后开始新牌局
      setTimeout(() => startNewHand(room), 5000);
      return;
  }
  
  // 设置下一个行动的玩家
  const dealerIndex = room.dealerPosition;
  room.currentPlayerIndex = (dealerIndex + 1) % room.players.length;
  
  io.to(room.id).emit('gameStage', {
    stage: room.gameState,
    communityCards: room.communityCards,
    pot: room.pot,
    currentPlayer: room.players[room.currentPlayerIndex]?.id
  });
}

// 开始新手牌
function startNewHand(room) {
  if (room.players.length < 2) {
    room.gameState = 'waiting';
    io.to(room.id).emit('gameState', { state: 'waiting', message: '等待更多玩家加入' });
    return;
  }
  
  room.gameState = 'preflop';
  room.communityCards = [];
  room.pot = 0;
  room.dealerPosition = (room.dealerPosition + 1) % room.players.length;
  
  dealCards(room);
  
  // 设置大小盲注
  const dealerIndex = room.dealerPosition;
  const sbIndex = (dealerIndex + 1) % room.players.length;
  const bbIndex = (dealerIndex + 2) % room.players.length;
  
  const sbPlayer = room.players[sbIndex];
  const bbPlayer = room.players[bbIndex];
  
  const sbAmount = bet(sbPlayer, SMALL_BLIND);
  const bbAmount = bet(bbPlayer, BIG_BLIND);
  
  room.pot = sbAmount + bbAmount;
  room.currentBet = bbAmount;
  
  room.currentPlayerIndex = (bbIndex + 1) % room.players.length;
  
  io.to(room.id).emit('gameStart', {
    dealer: room.players[dealerIndex].id,
    smallBlind: { player: sbPlayer.id, amount: sbAmount },
    bigBlind: { player: bbPlayer.id, amount: bbAmount },
    pot: room.pot,
    communityCards: [],
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      chips: p.chips,
      avatar: p.avatar
    }))
  });
  
  // 发送私有牌给每个玩家
  room.players.forEach(player => {
    io.to(player.socketId).emit('myCards', {
      cards: player.cards
    });
  });
  
  io.to(room.id).emit('gameState', {
    state: 'preflop',
    currentPlayer: room.players[room.currentPlayerIndex]?.id,
    pot: room.pot,
    currentBet: room.currentBet
  });
}

// API: 获取房间列表
app.get('/api/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    playerCount: r.players.length,
    maxPlayers: MAX_PLAYERS_PER_TABLE,
    state: r.gameState
  }));
  res.json(roomList);
});

// API: 获取玩家统计
app.get('/api/stats/:playerId', (req, res) => {
  const { playerId } = req.params;
  
  // 从所有房间收集统计数据
  let totalGames = 0;
  let totalWins = 0;
  let totalChips = 0;
  
  rooms.forEach(room => {
    const player = room.players.find(p => p.id === playerId);
    if (player && player.stats) {
      totalGames += player.stats.gamesPlayed || 0;
      totalWins += player.stats.wins || 0;
      totalChips = Math.max(totalChips, player.chips);
    }
  });
  
  res.json({
    playerId,
    totalGames,
    wins: totalWins,
    winRate: totalGames > 0 ? ((totalWins / totalGames) * 100).toFixed(1) + '%' : '0%'
  });
});

// API: 清除所有数据（管理员功能）
app.post('/api/admin/clear-all-data', (req, res) => {
  try {
    // 清除所有房间
    rooms.clear();
    
    // 清除所有玩家
    players.clear();
    
    // 断开所有socket连接
    io.sockets.sockets.forEach(socket => {
      socket.disconnect(true);
    });
    
    console.log('所有数据已清除');
    res.json({ success: true, message: '所有玩家历史数据和系统缓存已清除' });
  } catch (error) {
    console.error('清除数据失败:', error);
    res.status(500).json({ success: false, message: '清除数据失败' });
  }
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('新玩家连接:', socket.id);
  
  // 玩家登录/注册
  socket.on('login', (data) => {
    const { openid, name, avatar } = data;
    
    const player = {
      id: openid || socket.id,
      socketId: socket.id,
      name: name || '玩家' + socket.id.substring(0, 4),
      avatar: avatar || '',
      chips: STARTING_CHIPS,
      cards: [],
      currentBet: 0,
      folded: false,
      allIn: false,
      lastAction: null,
      stats: {
        gamesPlayed: 0,
        wins: 0
      }
    };
    
    players.set(socket.id, player);
    
    socket.emit('loginSuccess', {
      player: {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        chips: player.chips
      },
      stats: player.stats
    });
  });
  
  // 创建房间
  socket.on('createRoom', (data) => {
    const player = players.get(socket.id);
    if (!player) {
      socket.emit('error', { message: '请先登录' });
      return;
    }
    
    const { roomName, password } = data;
    const room = createRoom(roomName, password);
    room.players.push(player);
    player.roomId = room.id;
    
    socket.join(room.id);
    
    socket.emit('roomCreated', {
      room: {
        id: room.id,
        name: room.name,
        players: room.players.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          chips: p.chips
        }))
      }
    });
    
    // 通知房主可以开始游戏
    socket.emit('canStartGame', { roomId: room.id });
  });
  
  // 加入房间
  socket.on('joinRoom', (data) => {
    const player = players.get(socket.id);
    if (!player) {
      socket.emit('error', { message: '请先登录' });
      return;
    }
    
    const { roomId, password } = data;
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }
    
    if (room.password && room.password !== password) {
      socket.emit('error', { message: '密码错误' });
      return;
    }
    
    if (room.players.length >= MAX_PLAYERS_PER_TABLE) {
      socket.emit('error', { message: '房间已满' });
      return;
    }
    
    if (room.gameState !== 'waiting') {
      socket.emit('error', { message: '游戏正在进行中，无法加入' });
      return;
    }
    
    room.players.push(player);
    player.roomId = room.id;
    
    socket.join(room.id);
    
    socket.emit('roomJoined', {
      room: {
        id: room.id,
        name: room.name,
        players: room.players.map(p => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          chips: p.chips
        }))
      }
    });
    
    // 通知其他玩家
    io.to(room.id).emit('playerJoined', {
      player: {
        id: player.id,
        name: player.name,
        avatar: player.avatar
      }
    });
  });
  
  // 开始游戏
  socket.on('startGame', () => {
    const player = players.get(socket.id);
    if (!player) return;
    
    const room = rooms.get(player.roomId);
    if (!room) return;
    
    if (room.players.length < 2) {
      socket.emit('error', { message: '至少需要2名玩家才能开始游戏' });
      return;
    }
    
    // 检查是否是房主（第一个创建房间的玩家）
    if (room.players[0].id !== player.id) {
      socket.emit('error', { message: '只有房主才能开始游戏' });
      return;
    }
    
    startNewHand(room);
  });
  
  // 玩家动作
  socket.on('playerAction', (data) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    const room = rooms.get(player.roomId);
    if (!room) return;
    
    const currentPlayer = room.players[room.currentPlayerIndex];
    if (currentPlayer?.id !== player.id) {
      socket.emit('error', { message: '还没轮到你行动' });
      return;
    }
    
    const { action, amount } = data;
    
    switch (action) {
      case 'fold':
        player.folded = true;
        player.lastAction = 'fold';
        player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + 1;
        break;
        
      case 'check':
        if (player.currentBet < room.currentBet) {
          socket.emit('error', { message: '无法过牌，需要跟注' });
          return;
        }
        player.lastAction = 'check';
        break;
        
      case 'call':
        const callAmount = room.currentBet - player.currentBet;
        const called = bet(player, callAmount);
        room.pot += called;
        player.lastAction = 'call';
        break;
        
      case 'raise':
        if (amount <= room.currentBet) {
          socket.emit('error', { message: '加注金额必须大于当前下注' });
          return;
        }
        const raiseAmount = amount - player.currentBet;
        const raised = bet(player, raiseAmount);
        room.pot += raised;
        room.currentBet = player.currentBet;
        player.lastAction = 'raise';
        break;
        
      case 'allIn':
        const allInAmount = player.chips;
        bet(player, allInAmount);
        room.pot += allInAmount;
        room.currentBet = Math.max(room.currentBet, player.currentBet);
        player.lastAction = 'allIn';
        break;
    }
    
    // 广播玩家动作
    io.to(room.id).emit('playerActed', {
      playerId: player.id,
      action,
      amount: amount || 0,
      chips: player.chips,
      currentBet: player.currentBet,
      pot: room.pot
    });
    
    // 检查是否进入下一阶段
    if (isRoundComplete(room)) {
      nextStage(room);
    } else {
      // 下一个玩家行动
      const next = getNextPlayer(room);
      if (next) {
        room.currentPlayerIndex = room.players.findIndex(p => p.id === next.id);
        io.to(room.id).emit('gameState', {
          state: room.gameState,
          currentPlayer: next.id,
          pot: room.pot,
          currentBet: room.currentBet
        });
      }
    }
  });
  
  // 离开房间
  socket.on('leaveRoom', () => {
    const player = players.get(socket.id);
    if (!player || !player.roomId) return;
    
    const room = rooms.get(player.roomId);
    if (!room) return;
    
    const index = room.players.findIndex(p => p.id === player.id);
    if (index !== -1) {
      room.players.splice(index, 1);
    }
    
    delete player.roomId;
    socket.leave(room.id);
    
    io.to(room.id).emit('playerLeft', { playerId: player.id });
    
    // 如果房间空了，删除房间
    if (room.players.length === 0) {
      rooms.delete(room.id);
    } else if (room.gameState !== 'waiting') {
      // 游戏中断
      room.gameState = 'waiting';
      io.to(room.id).emit('gameInterrupted', { message: '游戏中断，等待重新开始' });
    }
  });
  
  // 断开连接
  socket.on('disconnect', () => {
    const player = players.get(socket.id);
    if (player && player.roomId) {
      const room = rooms.get(player.roomId);
      if (room) {
        const index = room.players.findIndex(p => p.id === player.id);
        if (index !== -1) {
          room.players.splice(index, 1);
        }
        
        io.to(room.id).emit('playerLeft', { playerId: player.id });
        
        if (room.players.length === 0) {
          rooms.delete(room.id);
        } else if (room.gameState !== 'waiting') {
          room.gameState = 'waiting';
          io.to(room.id).emit('gameInterrupted', { message: '游戏中断，等待重新开始' });
        }
      }
    }
    players.delete(socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`德州扑克服务器运行在 http://localhost:${PORT}`);
});