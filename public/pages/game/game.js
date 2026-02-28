// pages/game/game.js
const app = getApp();

Page({
  data: {
    room: {
      id: '',
      name: ''
    },
    players: [],
    myPlayerId: '',
    myCards: [],
    myBestHand: null,
    myChips: 0,
    gameState: {
      state: 'waiting',
      pot: 0,
      currentBet: 0,
      currentPlayer: null,
      communityCards: [],
      dealer: null
    },
    isMyTurn: false,
    canCheck: false,
    canCall: false,
    callAmount: 0,
    showRaiseModal: false,
    raiseOptions: [],
    raiseAmount: 0,
    customRaiseAmount: '',
    showShowdownModal: false,
    showdownData: {}
  },
  
  onLoad(options) {
    const roomId = options.roomId;
    if (roomId) {
      this.setData({ 'room.id': roomId });
    }
    
    this.setData({ myPlayerId: app.globalData.player?.id });
    
    // 监听游戏事件
    wx.eventCenter.on('gameStart', this.onGameStart.bind(this));
    wx.eventCenter.on('myCards', this.onMyCards.bind(this));
    wx.eventCenter.on('gameState', this.onGameState.bind(this));
    wx.eventCenter.on('playerActed', this.onPlayerActed.bind(this));
    wx.eventCenter.on('gameStage', this.onGameStage.bind(this));
    wx.eventCenter.on('gameShowdown', this.onGameShowdown.bind(this));
    wx.eventCenter.on('gameInterrupted', this.onGameInterrupted.bind(this));
  },
  
  onUnload() {
    wx.eventCenter.off('gameStart', this.onGameStart.bind(this));
    wx.eventCenter.off('myCards', this.onMyCards.bind(this));
    wx.eventCenter.off('gameState', this.onGameState.bind(this));
    wx.eventCenter.off('playerActed', this.onPlayerActed.bind(this));
    wx.eventCenter.off('gameStage', this.onGameStage.bind(this));
    wx.eventCenter.off('gameShowdown', this.onGameShowdown.bind(this));
    wx.eventCenter.off('gameInterrupted', this.onGameInterrupted.bind(this));
  },
  
  onGameStart(data) {
    this.setData({
      players: data.players.map(p => ({
        ...p,
        cards: [],
        currentBet: 0,
        folded: false,
        allIn: false
      })),
      'gameState.pot': data.pot,
      'gameState.dealer': data.dealer,
      'gameState.state': 'preflop'
    });
    
    this.updateMyInfo();
  },
  
  onMyCards(data) {
    this.setData({
      myCards: data.cards
    });
    
    this.evaluateMyHand();
  },
  
  evaluateMyHand() {
    // 这里可以添加牌型评估逻辑
    // 暂时省略，因为需要服务器返回评估结果
  },
  
  onGameState(data) {
    const isMyTurn = data.currentPlayer === this.data.myPlayerId;
    
    let canCheck = false;
    let canCall = false;
    let callAmount = 0;
    
    if (isMyTurn) {
      const myPlayer = this.data.players.find(p => p.id === this.data.myPlayerId);
      if (myPlayer) {
        const currentBet = data.currentBet || 0;
        callAmount = currentBet - myPlayer.currentBet;
        
        canCheck = myPlayer.currentBet >= currentBet;
        canCall = callAmount > 0 && myPlayer.chips >= callAmount;
      }
    }
    
    this.setData({
      'gameState.state': data.state,
      'gameState.pot': data.pot,
      'gameState.currentBet': data.currentBet,
      'gameState.currentPlayer': data.currentPlayer,
      isMyTurn,
      canCheck,
      canCall,
      callAmount
    });
  },
  
  onPlayerActed(data) {
    const players = this.data.players.map(p => {
      if (p.id === data.playerId) {
        return {
          ...p,
          chips: data.chips,
          currentBet: data.currentBet,
          lastAction: data.action,
          folded: data.action === 'fold',
          allIn: data.action === 'allIn'
        };
      }
      return p;
    });
    
    this.setData({ players });
  },
  
  onGameStage(data) {
    this.setData({
      'gameState.state': data.stage,
      'gameState.communityCards': data.communityCards,
      'gameState.pot': data.pot,
      'gameState.currentPlayer': data.currentPlayer,
      isMyTurn: data.currentPlayer === this.data.myPlayerId
    });
    
    this.updateMyInfo();
  },
  
  onGameShowdown(data) {
    const showdownData = {
      communityCards: data.communityCards,
      winnerName: data.winners[0]?.name || '平局',
      winAmount: data.winners[0]?.winAmount || 0,
      playerHands: data.playerHands.map(ph => ({
        name: ph.name,
        cards: ph.cards,
        hand: ph.hand
      }))
    };
    
    // 更新所有玩家显示手牌
    const players = this.data.players.map(p => {
      const handInfo = data.playerHands.find(ph => ph.id === p.id);
      if (handInfo) {
        return {
          ...p,
          cards: handInfo.cards || [],
          folded: !handInfo.cards
        };
      }
      return p;
    });
    
    this.setData({
      players,
      showShowdownModal: true,
      showdownData
    });
  },
  
  onGameInterrupted(data) {
    wx.showModal({
      title: '游戏中断',
      content: data.message,
      showCancel: false,
      success: () => {
        wx.navigateBack();
      }
    });
  },
  
  updateMyInfo() {
    const player = this.data.players.find(p => p.id === this.data.myPlayerId);
    if (player) {
      this.setData({
        myChips: player.chips,
        raiseOptions: [
          Math.min(player.chips, this.data.gameState.currentBet * 2),
          Math.min(player.chips, this.data.gameState.currentBet * 3),
          Math.min(player.chips, this.data.gameState.currentBet * 4),
          player.chips
        ]
      });
    }
  },
  
  // 获取游戏阶段文本
  getStageText(state) {
    const stageMap = {
      'waiting': '等待开始',
      'preflop': '翻牌前',
      'flop': '翻牌圈',
      'turn': '转牌圈',
      'river': '河牌圈',
      'showdown': '摊牌'
    };
    return stageMap[state] || '等待中';
  },
  
  // 获取花色样式类
  getSuitClass(suit) {
    if (suit === '♥' || suit === '♦') {
      return 'red';
    }
    return 'black';
  },
  
  // 获取庄家位置
  getDealerPosition() {
    // 根据庄家索引计算位置
    return '';
  },
  
  // 弃牌
  fold() {
    app.sendSocketMessage('playerAction', { action: 'fold' });
  },
  
  // 过牌
  check() {
    app.sendSocketMessage('playerAction', { action: 'check' });
  },
  
  // 跟注
  call() {
    app.sendSocketMessage('playerAction', { action: 'call' });
  },
  
  // 展示加注弹窗
  showRaiseModal() {
    this.setData({ showRaiseModal: true });
  },
  
  closeRaiseModal() {
    this.setData({ showRaiseModal: false });
  },
  
  preventBubble() {},
  
  selectRaiseOption(e) {
    const amount = e.currentTarget.dataset.amount;
    this.setData({ raiseAmount: amount });
  },
  
  onRaiseInput(e) {
    const amount = parseInt(e.detail.value) || 0;
    this.setData({ 
      customRaiseAmount: e.detail.value,
      raiseAmount: amount
    });
  },
  
  // 确认加注
  confirmRaise() {
    if (this.data.raiseAmount <= this.data.gameState.currentBet) {
      wx.showToast({ title: '加注金额必须大于当前下注', icon: 'none' });
      return;
    }
    
    app.sendSocketMessage('playerAction', { 
      action: 'raise',
      amount: this.data.raiseAmount
    });
    
    this.closeRaiseModal();
  },
  
  // 全下
  allIn() {
    app.sendSocketMessage('playerAction', { action: 'allIn' });
  },
  
  // 关闭摊牌弹窗
  closeShowdownModal() {
    this.setData({ showShowdownModal: false });
  }
});