// 德州扑克 H5 应用
const App = {
  // 服务器地址 - 根据环境自动选择
  // 开发环境: http://localhost:3000
  // 生产环境: 通过相对路径或环境变量
  serverUrl: (function() {
    const hostname = window.location.hostname;
    // 如果是localhost或127.0.0.1，使用本地服务器
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    // 生产环境使用相对路径（假设后端在同一域名）
    return '';
  })(),
  socket: null,
  
  // 用户信息
  userInfo: null,
  
  // 当前房间
  currentRoom: null,
  
  // 游戏状态
  gameState: {
    players: [],
    communityCards: [],
    pot: 0,
    currentPlayer: null,
    myCards: []
  },
  
  // 初始化应用
  init() {
    this.loadUserInfo();
    this.bindEvents();
    this.checkLoginStatus();
  },
  
  // 加载用户信息
  loadUserInfo() {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      this.userInfo = JSON.parse(stored);
      this.updateUserInfoUI();
    }
  },
  
  // 保存用户信息
  saveUserInfo(userInfo) {
    this.userInfo = userInfo;
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    this.updateUserInfoUI();
  },
  
  // 更新用户信息UI
  updateUserInfoUI() {
    const avatar = document.getElementById('user-avatar');
    const nickname = document.getElementById('user-nickname');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileNickname = document.getElementById('profile-nickname');
    
    if (avatar && this.userInfo) {
      avatar.src = this.userInfo.avatarUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%232d3748"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">👤</text></svg>';
      nickname.textContent = this.userInfo.nickName || '游客';
    }
    
    if (profileAvatar && this.userInfo) {
      profileAvatar.src = this.userInfo.avatarUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%232d3748"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">👤</text></svg>';
      profileNickname.textContent = this.userInfo.nickName || '游客';
    }
  },
  
  // 检查登录状态
  checkLoginStatus() {
    if (this.userInfo) {
      this.showPage('index');
      this.initSocket();
    } else {
      this.showPage('login');
    }
  },
  
  // 绑定事件
  bindEvents() {
    // 微信登录
    document.getElementById('btn-wechat-login')?.addEventListener('click', () => {
      this.handleWechatLogin();
    });
    
    // 游客登录
    document.getElementById('btn-guest-login')?.addEventListener('click', () => {
      this.handleGuestLogin();
    });
    
    // Tab切换
    document.getElementById('tab-rooms')?.addEventListener('click', () => {
      this.switchTab('rooms');
    });
    
    document.getElementById('tab-create')?.addEventListener('click', () => {
      this.switchTab('create');
    });
    
    // 创建房间
    document.getElementById('btn-create-room')?.addEventListener('click', () => {
      this.createRoom();
    });
    
    // 加入房间
    document.getElementById('btn-confirm-join')?.addEventListener('click', () => {
      this.confirmJoinRoom();
    });
    
    // 离开房间
    document.getElementById('btn-leave-room')?.addEventListener('click', () => {
      this.leaveRoom();
    });
    
    // 开始游戏
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      this.startGame();
    });
    
    // 退出游戏
    document.getElementById('btn-exit-game')?.addEventListener('click', () => {
      this.exitGame();
    });
    
    // 游戏操作按钮
    document.getElementById('btn-check')?.addEventListener('click', () => {
      this.playerAction('check');
    });
    
    document.getElementById('btn-call')?.addEventListener('click', () => {
      this.playerAction('call');
    });
    
    document.getElementById('btn-raise')?.addEventListener('click', () => {
      this.playerAction('raise');
    });
    
    document.getElementById('btn-fold')?.addEventListener('click', () => {
      this.playerAction('fold');
    });
    
    // 关闭摊牌弹窗
    document.getElementById('btn-close-showdown')?.addEventListener('click', () => {
      document.getElementById('showdown-modal').style.display = 'none';
    });
    
    // 个人中心
    document.getElementById('btn-profile')?.addEventListener('click', () => {
      this.showPage('profile');
    });
    
    // 退出登录
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      this.logout();
    });
    
    // 弹窗关闭
    document.getElementById('join-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'join-modal') {
        document.getElementById('join-modal').style.display = 'none';
      }
    });
  },
  
  // 页面切换
  showPage(pageName) {
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
      page.classList.add('hidden');
    });
    
    // 显示目标页面
    document.getElementById(`page-${pageName}`)?.classList.remove('hidden');
    
    // 页面显示时执行的操作
    if (pageName === 'index') {
      this.updateUserInfoUI();
      this.fetchRooms();
    }
  },
  
  // Tab切换
  switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');
    
    if (tab === 'rooms') {
      document.getElementById('room-list').style.display = 'block';
      document.getElementById('create-room').classList.add('hidden');
    } else {
      document.getElementById('room-list').style.display = 'none';
      document.getElementById('create-room').classList.remove('hidden');
    }
  },
  
  // 微信登录
  handleWechatLogin() {
    // 模拟微信登录，实际需要通过微信OAuth获取
    const userInfo = {
      id: 'wx_' + Date.now(),
      nickName: '玩家' + Math.floor(Math.random() * 1000),
      avatarUrl: '',
      openid: 'wx_' + Date.now()
    };
    
    this.saveUserInfo(userInfo);
    this.initSocket();
    
    setTimeout(() => {
      this.showPage('index');
    }, 500);
  },
  
  // 游客登录
  handleGuestLogin() {
    const guestInfo = {
      id: 'guest_' + Date.now(),
      nickName: '游客' + Math.floor(Math.random() * 1000),
      avatarUrl: '',
      openid: 'guest_' + Date.now()
    };
    
    this.saveUserInfo(guestInfo);
    this.initSocket();
    
    setTimeout(() => {
      this.showPage('index');
    }, 500);
  },
  
  // 退出登录
  logout() {
    this.userInfo = null;
    localStorage.removeItem('userInfo');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.showPage('login');
  },
  
  // 初始化WebSocket
  initSocket() {
    // 如果已经连接，直接返回
    if (this.socket && this.socket.connected) {
      return;
    }
    
    // 关闭已有连接
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    // 使用Socket.IO连接
    this.socket = io(this.serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    this.socket.on('connect', () => {
      console.log('Socket.IO connected, socket id:', this.socket.id);
      this.showToast('已连接服务器');
      this.updateConnectionStatus(true);
      
      // 登录
      console.log('Sending login with:', {
        openid: this.userInfo.id,
        name: this.userInfo.nickName,
        avatar: this.userInfo.avatarUrl
      });
      this.socket.emit('login', {
        openid: this.userInfo.id,
        name: this.userInfo.nickName,
        avatar: this.userInfo.avatarUrl
      });
    });
    
    this.socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err.message);
      this.showToast('连接服务器失败: ' + err.message);
      this.updateConnectionStatus(false);
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      this.updateConnectionStatus(true);
    });
    
    this.socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed');
      this.showToast('无法重新连接服务器');
      this.updateConnectionStatus(false);
    });
    
    // 监听各种事件
    this.socket.on('loginSuccess', (data) => {
      console.log('Login success:', data);
    });
    
    this.socket.on('roomCreated', (data) => {
      this.onRoomCreated(data);
    });
    
    this.socket.on('roomJoined', (data) => {
      this.onRoomJoined(data);
    });
    
    this.socket.on('roomUpdate', (data) => {
      this.onRoomUpdate(data);
    });
    
    this.socket.on('playerJoined', (data) => {
      this.onPlayerJoined(data);
    });
    
    this.socket.on('playerLeft', (data) => {
      this.onPlayerLeft(data);
    });
    
    this.socket.on('gameStart', (data) => {
      this.onGameStart(data);
    });
    
    this.socket.on('myCards', (data) => {
      this.onMyCards(data);
    });
    
    this.socket.on('gameState', (data) => {
      this.onGameState(data);
    });
    
    this.socket.on('playerActed', (data) => {
      this.onPlayerActed(data);
    });
    
    this.socket.on('gameStage', (data) => {
      this.onGameStage(data);
    });
    
    this.socket.on('gameShowdown', (data) => {
      this.onShowdown(data);
    });
    
    this.socket.on('gameEnd', (data) => {
      this.onGameEnd(data);
    });
    
    this.socket.on('error', (data) => {
      this.showToast(data.message);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.showToast('已断开连接');
    });
  },
  
  // 发送消息
  sendMessage(type, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(type, data);
    }
  },

  // 获取房间列表
  fetchRooms() {
    fetch(`${this.serverUrl}/api/rooms`)
      .then(res => res.json())
      .then(rooms => {
        this.renderRoomList(rooms);
      })
      .catch(err => {
        console.error('获取房间列表失败:', err);
        // 使用模拟数据
        this.renderRoomList([
          { id: 'AAA11111', name: '欢乐牌桌', playerCount: 3, maxPlayers: 6, state: 'waiting' },
          { id: 'BBB22222', name: '高手对决', playerCount: 5, maxPlayers: 6, state: 'preflop' }
        ]);
      });
  },
  
  // 渲染房间列表
  renderRoomList(rooms) {
    const roomList = document.getElementById('room-list');
    const emptyTip = document.getElementById('empty-tip');
    
    if (!rooms || rooms.length === 0) {
      roomList.innerHTML = '';
      emptyTip.style.display = 'block';
      return;
    }
    
    emptyTip.style.display = 'none';
    roomList.innerHTML = rooms.map(room => `
      <div class="room-card" data-room-id="${room.id}">
        <div class="room-info">
          <span class="room-name">${room.name}</span>
          <span class="room-state ${room.state}">${this.getRoomState(room.state)}</span>
        </div>
        <div class="room-players">${room.playerCount || 0}/${room.maxPlayers || 6} 人</div>
      </div>
    `).join('');
    
    // 绑定点击事件
    roomList.querySelectorAll('.room-card').forEach(card => {
      card.addEventListener('click', () => {
        const roomId = card.dataset.roomId;
        const room = rooms.find(r => r.id === roomId);
        
        if (room.state !== 'waiting') {
          this.showToast('游戏正在进行中');
          return;
        }
        
        if (room.password) {
          this.showJoinModal(roomId);
        } else {
          this.joinRoom(roomId, '');
        }
      });
    });
  },
  
  // 获取房间状态文本
  getRoomState(state) {
    const stateMap = {
      'waiting': '等待中',
      'preflop': '翻牌前',
      'flop': '翻牌',
      'turn': '转牌',
      'river': '河牌',
      'showdown': '摊牌'
    };
    return stateMap[state] || '等待中';
  },
  
  // 创建房间
  createRoom() {
    const roomName = document.getElementById('input-room-name').value.trim();
    const password = document.getElementById('input-password').value;
    
    if (!roomName) {
      this.showToast('请输入房间名称');
      return;
    }
    
    this.sendMessage('createRoom', {
      roomName,
      password
    });
  },
  
  // 房间创建成功
  onRoomCreated(data) {
    const { room } = data;
    this.currentRoom = room;
    document.getElementById('room-name').textContent = room.name;
    document.getElementById('invite-code').textContent = room.id;
    this.showPage('room');
    this.renderPlayers(room.players || []);
  },
  
  // 显示加入弹窗
  showJoinModal(roomId) {
    document.getElementById('join-modal').style.display = 'flex';
    document.getElementById('input-join-room-id').value = roomId;
  },
  
  // 确认加入房间
  confirmJoinRoom() {
    const roomId = document.getElementById('input-join-room-id').value.trim();
    const password = document.getElementById('input-join-password').value;
    
    if (!roomId) {
      this.showToast('请输入房间号');
      return;
    }
    
    this.joinRoom(roomId, password);
  },
  
  // 加入房间
  joinRoom(roomId, password) {
    this.sendMessage('joinRoom', { roomId, password });
  },
  
  // 加入房间成功
  onRoomJoined(data) {
    const { room } = data;
    this.currentRoom = room;
    document.getElementById('room-name').textContent = room.name;
    document.getElementById('invite-code').textContent = room.id;
    this.showPage('room');
    this.renderPlayers(room.players || []);
  },
  
  // 房间更新
  onRoomUpdate(room) {
    if (this.currentRoom && room.id === this.currentRoom.id) {
      this.currentRoom = room;
      this.renderPlayers(room.players || []);
    }
  },
  
  // 玩家加入
  onPlayerJoined(player) {
    if (this.currentRoom) {
      this.currentRoom.players = this.currentRoom.players || [];
      this.currentRoom.players.push(player);
      this.renderPlayers(this.currentRoom.players);
      this.showToast(`${player.name} 加入了房间`);
    }
  },
  
  // 玩家离开
  onPlayerLeft(data) {
    if (this.currentRoom) {
      this.currentRoom.players = (this.currentRoom.players || []).filter(p => p.id !== data.playerId);
      this.renderPlayers(this.currentRoom.players);
    }
  },
  
  // 渲染玩家列表
  renderPlayers(players) {
    const playersList = document.getElementById('players-list');
    
    if (!players || players.length === 0) {
      playersList.innerHTML = '<div class="empty-tip">等待玩家加入...</div>';
      return;
    }
    
    playersList.innerHTML = players.map((player, index) => `
      <div class="player-card ${index === 0 ? 'owner' : ''}">
        <img class="player-avatar" src="${player.avatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%232d3748"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">👤</text></svg>'}" alt="头像">
        <div class="player-info">
          <div class="player-name">${player.name}</div>
          <div class="player-status waiting">等待中</div>
        </div>
        ${index === 0 ? '<span class="owner-badge">房主</span>' : ''}
      </div>
    `).join('');
    
    // 显示/隐藏开始游戏按钮
    const startBtn = document.getElementById('btn-start-game');
    if (startBtn) {
      startBtn.style.display = players.length >= 2 ? 'block' : 'none';
    }
  },
  
  // 离开房间
  leaveRoom() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendMessage('leaveRoom', {});
    }
    this.currentRoom = null;
    this.showPage('index');
  },
  
  // 开始游戏
  startGame() {
    if (this.currentRoom && this.currentRoom.players.length < 2) {
      this.showToast('至少需要2名玩家');
      return;
    }
    
    this.sendMessage('startGame', {});
  },
  
  // 游戏开始
  onGameStart(data) {
    this.gameState.players = data.players.map(p => ({
      ...p,
      cards: [],
      currentBet: 0,
      folded: false
    }));
    this.gameState.pot = data.pot || 0;
    this.gameState.dealer = data.dealer;
    
    document.getElementById('pot-amount').textContent = this.gameState.pot;
    this.showPage('game');
    this.renderGamePlayers();
  },
  
  // 收到手牌
  onMyCards(data) {
    this.gameState.myCards = data.cards;
    this.renderMyCards();
  },
  
  // 游戏状态更新
  onGameState(data) {
    const isMyTurn = data.currentPlayer === this.userInfo.id;
    
    this.gameState.state = data.state;
    this.gameState.pot = data.pot;
    this.gameState.currentBet = data.currentBet;
    this.gameState.currentPlayer = data.currentPlayer;
    
    document.getElementById('pot-amount').textContent = this.gameState.pot;
    
    // 更新操作按钮
    this.updateActionButtons(isMyTurn, data);
  },
  
  // 更新操作按钮
  updateActionButtons(isMyTurn, data) {
    const buttons = document.getElementById('action-buttons');
    const statusText = document.getElementById('status-text');
    
    if (isMyTurn) {
      buttons.style.display = 'flex';
      statusText.textContent = '轮到你了！';
      
      const myPlayer = this.gameState.players.find(p => p.id === this.userInfo.id);
      if (myPlayer) {
        const callAmount = (data.currentBet || 0) - myPlayer.currentBet;
        document.getElementById('call-amount').textContent = callAmount;
        
        const canCheck = myPlayer.currentBet >= (data.currentBet || 0);
        document.getElementById('btn-check').style.display = canCheck ? 'block' : 'none';
        document.getElementById('btn-call').style.display = callAmount > 0 && myPlayer.chips >= callAmount ? 'block' : 'none';
      }
    } else {
      buttons.style.display = 'none';
      statusText.textContent = `等待 ${this.getPlayerName(data.currentPlayer)} 行动...`;
    }
  },
  
  // 玩家行动
  onPlayerActed(data) {
    const player = this.gameState.players.find(p => p.id === data.playerId);
    if (player) {
      player.chips = data.chips;
      player.currentBet = data.currentBet;
      player.lastAction = data.action;
      player.folded = data.action === 'fold';
    }
    
    this.renderGamePlayers();
  },
  
  // 游戏阶段更新
  onGameStage(data) {
    this.gameState.state = data.stage;
    this.gameState.communityCards = data.communityCards || [];
    this.gameState.pot = data.pot;
    this.gameState.currentPlayer = data.currentPlayer;
    
    document.getElementById('pot-amount').textContent = this.gameState.pot;
    this.renderCommunityCards();
    this.updateActionButtons(data.currentPlayer === this.userInfo.id, data);
  },
  
  // 摊牌
  onShowdown(data) {
    this.gameState.communityCards = data.communityCards || [];
    this.renderCommunityCards();
    
    // 显示摊牌结果
    const modal = document.getElementById('showdown-modal');
    const content = document.getElementById('showdown-content');
    
    content.innerHTML = `
      <div class="winner-info">获胜者: ${data.winners[0]?.name || '平局'}</div>
      <div class="win-amount">赢得底池: ${data.winners[0]?.winAmount || 0}</div>
    `;
    
    modal.style.display = 'flex';
  },
  
  // 游戏结束
  onGameEnd(data) {
    this.showToast('游戏结束');
    setTimeout(() => {
      this.showPage('room');
    }, 2000);
  },
  
  // 渲染游戏玩家
  renderGamePlayers() {
    const area = document.getElementById('players-area');
    
    area.innerHTML = this.gameState.players.map(player => {
      const isActive = player.id === this.gameState.currentPlayer;
      const isMe = player.id === this.userInfo.id;
      
      return `
        <div class="game-player ${isActive ? 'active' : ''}">
          <img class="avatar" src="${player.avatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%232d3748"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="40">👤</text></svg>'}" alt="头像">
          <div>
            <div class="player-name">${player.name}${isMe ? '(你)' : ''}</div>
            <div class="player-chips">筹码: ${player.chips}</div>
          </div>
          ${player.currentBet > 0 ? `<div class="player-bet">已下注: ${player.currentBet}</div>` : ''}
          ${player.folded ? '<div class="player-action">已弃牌</div>' : ''}
          ${player.lastAction ? `<div class="player-action">${this.getActionText(player.lastAction)}</div>` : ''}
        </div>
      `;
    }).join('');
  },
  
  // 渲染公共牌
  renderCommunityCards() {
    const area = document.getElementById('community-cards');
    
    area.innerHTML = this.gameState.communityCards.map(card => {
      const { suit, rank } = this.parseCard(card);
      const isRed = suit === '♥' || suit === '♦';
      
      return `<div class="card ${isRed ? 'red' : 'black'}">${rank}${suit}</div>`;
    }).join('');
  },
  
  // 渲染我的手牌
  renderMyCards() {
    const area = document.getElementById('my-cards');
    
    area.innerHTML = this.gameState.myCards.map(card => {
      const { suit, rank } = this.parseCard(card);
      const isRed = suit === '♥' || suit === '♦';
      
      return `<div class="card ${isRed ? 'red' : 'black'}">${rank}${suit}</div>`;
    }).join('');
  },
  
  // 解析纸牌
  parseCard(card) {
    if (typeof card === 'string') {
      const match = card.match(/^([A-Z0-9])([♥♦♣♠])$/);
      if (match) {
        return { rank: match[1], suit: match[2] };
      }
    }
    return { rank: card.rank || '?', suit: card.suit || '♠' };
  },
  
  // 获取玩家名称
  getPlayerName(playerId) {
    const player = this.gameState.players.find(p => p.id === playerId);
    return player?.name || '未知';
  },
  
  // 获取动作文本
  getActionText(action) {
    const actionMap = {
      'check': '看牌',
      'call': '跟注',
      'raise': '加注',
      'fold': '弃牌',
      'allIn': '全下'
    };
    return actionMap[action] || action;
  },
  
  // 玩家操作
  playerAction(action) {
    if (action === 'raise') {
      // 简单处理：加注当前底池的2倍
      const myPlayer = this.gameState.players.find(p => p.id === this.userInfo.id);
      const raiseAmount = (this.gameState.currentBet || 0) * 2;
      this.sendMessage('playerAction', { action, amount: raiseAmount });
    } else {
      this.sendMessage('playerAction', { action });
    }
  },
  
  // 退出游戏
  exitGame() {
    if (this.socket && this.socket.connected) {
      this.sendMessage('leaveRoom', {});
    }
    
    this.gameState = {
      players: [],
      communityCards: [],
      pot: 0,
      currentPlayer: null,
      myCards: []
    };
    
    this.showPage('room');
  },
  
  // 显示提示
  showToast(message) {
    // 移除已存在的toast
    const existing = document.querySelector('.toast');
    if (existing) {
      existing.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 2000);
  },
  
  // 更新连接状态显示
  updateConnectionStatus(connected) {
    let statusEl = document.getElementById('connection-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'connection-status';
      statusEl.style.cssText = 'position:fixed;top:10px;right:10px;padding:5px 10px;background:rgba(0,0,0,0.7);color:white;border-radius:4px;font-size:12px;z-index:9999;';
      document.body.appendChild(statusEl);
    }
    statusEl.textContent = connected ? '🟢 已连接' : '🔴 未连接';
    statusEl.style.background = connected ? 'rgba(0,128,0,0.7)' : 'rgba(255,0,0,0.7)';
  }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});