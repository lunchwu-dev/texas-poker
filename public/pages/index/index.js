// pages/index/index.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    activeTab: 'rooms',
    rooms: [],
    roomName: '',
    password: '',
    showJoinModal: false,
    joinRoomId: '',
    joinPassword: ''
  },
  
  onLoad() {
    this.getUserInfo();
    this.fetchRooms();
    
    // 监听房间更新
    wx.eventCenter.on('roomUpdate', this.onRoomUpdate.bind(this));
  },
  
  onShow() {
    this.getUserInfo();
    this.fetchRooms();
  },
  
  onUnload() {
    wx.eventCenter.off('roomUpdate', this.onRoomUpdate.bind(this));
  },
  
  getUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || app.globalData.userInfo;
    this.setData({ userInfo });
  },
  
  // 获取房间列表
  fetchRooms() {
    wx.request({
      url: `${app.globalData.serverUrl}/api/rooms`,
      success: (res) => {
        if (res.data) {
          this.setData({ rooms: res.data });
        }
      },
      fail: (err) => {
        console.error('获取房间列表失败', err);
        // 使用模拟数据
        this.setData({
          rooms: [
            { id: 'AAA11111', name: '欢乐牌桌', playerCount: 3, maxPlayers: 6, state: 'waiting' },
            { id: 'BBB22222', name: '高手对决', playerCount: 5, maxPlayers: 6, state: 'preflop' }
          ]
        });
      }
    });
  },
  
  // 监听房间更新
  onRoomUpdate(room) {
    this.setData({
      rooms: this.data.rooms.map(r => r.id === room.id ? { ...r, players: room.players } : r)
    });
  },
  
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },
  
  onRoomNameInput(e) {
    this.setData({ roomName: e.detail.value });
  },
  
  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },
  
  // 创建房间
  createRoom() {
    if (!this.data.roomName) {
      wx.showToast({ title: '请输入房间名称', icon: 'none' });
      return;
    }
    
    wx.showLoading({ title: '创建中...' });
    
    app.sendSocketMessage('createRoom', {
      roomName: this.data.roomName,
      password: this.data.password
    });
    
    // 监听房间创建成功
    wx.eventCenter.once('roomCreated', (room) => {
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/room/room?roomId=${room.room.id}`
      });
    });
  },
  
  // 加入房间
  joinRoom(e) {
    const roomId = e.currentTarget.dataset.roomId;
    const room = this.data.rooms.find(r => r.id === roomId);
    
    if (room.state !== 'waiting') {
      wx.showToast({ title: '游戏正在进行中', icon: 'none' });
      return;
    }
    
    if (room.password) {
      // 需要密码
      this.setData({ 
        showJoinModal: true,
        joinRoomId: roomId 
      });
    } else {
      this.doJoinRoom(roomId, '');
    }
  },
  
  onJoinRoomIdInput(e) {
    this.setData({ joinRoomId: e.detail.value });
  },
  
  onJoinPasswordInput(e) {
    this.setData({ joinPassword: e.detail.value });
  },
  
  confirmJoinRoom() {
    if (!this.data.joinRoomId) {
      wx.showToast({ title: '请输入房间号', icon: 'none' });
      return;
    }
    this.doJoinRoom(this.data.joinRoomId, this.data.joinPassword);
  },
  
  doJoinRoom(roomId, password) {
    wx.showLoading({ title: '加入中...' });
    
    app.sendSocketMessage('joinRoom', {
      roomId,
      password
    });
    
    wx.eventCenter.once('roomJoined', (room) => {
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/room/room?roomId=${room.room.id}`
      });
    });
    
    wx.eventCenter.once('error', (data) => {
      wx.hideLoading();
      wx.showToast({ title: data.message, icon: 'none' });
    });
  },
  
  closeJoinModal() {
    this.setData({ showJoinModal: false });
  },
  
  preventBubble() {},
  
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
  
  // 跳转个人中心
  goToProfile() {
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  }
});