// pages/room/room.js
const app = getApp();

Page({
  data: {
    room: {
      id: '',
      name: '',
      players: []
    },
    isOwner: false
  },
  
  onLoad(options) {
    const roomId = options.roomId;
    if (roomId) {
      this.setData({ 'room.id': roomId });
    }
    
    // 监听房间更新
    wx.eventCenter.on('roomUpdate', this.onRoomUpdate.bind(this));
    wx.eventCenter.on('playerJoined', this.onPlayerJoined.bind(this));
    wx.eventCenter.on('playerLeft', this.onPlayerLeft.bind(this));
    wx.eventCenter.on('canStartGame', this.onCanStartGame.bind(this));
    
    // 监听游戏开始
    wx.eventCenter.on('gameStart', this.onGameStart.bind(this));
  },
  
  onUnload() {
    wx.eventCenter.off('roomUpdate', this.onRoomUpdate.bind(this));
    wx.eventCenter.off('playerJoined', this.onPlayerJoined.bind(this));
    wx.eventCenter.off('playerLeft', this.onPlayerLeft.bind(this));
    wx.eventCenter.off('canStartGame', this.onCanStartGame.bind(this));
    wx.eventCenter.off('gameStart', this.onGameStart.bind(this));
    
    // 离开房间
    app.sendSocketMessage('leaveRoom', {});
  },
  
  onRoomUpdate(room) {
    if (room.id === this.data.room.id) {
      this.setData({
        room: room,
        isOwner: room.players.length > 0 && room.players[0].id === app.globalData.player?.id
      });
    }
  },
  
  onPlayerJoined(player) {
    const players = [...this.data.room.players, player];
    this.setData({ 'room.players': players });
    wx.showToast({
      title: `${player.name} 加入了房间`,
      icon: 'none'
    });
  },
  
  onPlayerLeft(data) {
    const players = this.data.room.players.filter(p => p.id !== data.playerId);
    this.setData({ 'room.players': players });
  },
  
  onCanStartGame() {
    this.setData({ isOwner: true });
  },
  
  onGameStart(data) {
    wx.navigateTo({
      url: `/pages/game/game?roomId=${this.data.room.id}`
    });
  },
  
  goBack() {
    wx.showModal({
      title: '离开房间',
      content: '确定要离开当前房间吗？',
      success: (res) => {
        if (res.confirm) {
          app.sendSocketMessage('leaveRoom', {});
          wx.navigateBack();
        }
      }
    });
  },
  
  startGame() {
    if (this.data.room.players.length < 2) {
      wx.showToast({
        title: '至少需要2名玩家',
        icon: 'none'
      });
      return;
    }
    
    app.sendSocketMessage('startGame', {});
  },
  
  // 分享邀请
  onShareAppMessage() {
    return {
      title: `加入我的德州扑克房间 ${this.data.room.name}`,
      path: `/pages/index/index?roomId=${this.data.room.id}`,
      imageUrl: '/assets/icons/share.png'
    };
  }
});