// app.js
App({
  globalData: {
    userInfo: null,
    serverUrl: 'http://localhost:3000',
    socket: null,
    player: null,
    currentRoom: null
  },
  
  onLaunch() {
    // 检查登录状态
    this.checkLoginStatus();
  },
  
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },
  
  // 初始化WebSocket连接
  initSocket() {
    const that = this;
    const socket = wx.connectSocket({
      url: this.globalData.serverUrl,
      success() {
        console.log('WebSocket连接成功');
      },
      fail(err) {
        console.error('WebSocket连接失败:', err);
      }
    });
    
    socket.onOpen(() => {
      console.log('WebSocket已打开');
      // 自动登录
      if (that.globalData.userInfo) {
        that.login(that.globalData.userInfo);
      }
    });
    
    socket.onMessage((res) => {
      that.handleSocketMessage(JSON.parse(res.data));
    });
    
    socket.onClose(() => {
      console.log('WebSocket已关闭');
    });
    
    socket.onError((err) => {
      console.error('WebSocket错误:', err);
    });
    
    this.globalData.socket = socket;
    return socket;
  },
  
  // 处理WebSocket消息
  handleSocketMessage(data) {
    const event = data.type || data.event;
    
    switch (event) {
      case 'loginSuccess':
        this.globalData.player = data.player;
        wx.setStorageSync('player', data.player);
        wx.eventCenter.trigger('loginSuccess', data.player);
        break;
        
      case 'roomCreated':
      case 'roomJoined':
        this.globalData.currentRoom = data.room;
        wx.eventCenter.trigger('roomUpdate', data.room);
        break;
        
      case 'playerJoined':
        wx.eventCenter.trigger('playerJoined', data.player);
        break;
        
      case 'playerLeft':
        wx.eventCenter.trigger('playerLeft', data);
        break;
        
      case 'gameStart':
        wx.eventCenter.trigger('gameStart', data);
        break;
        
      case 'myCards':
        wx.eventCenter.trigger('myCards', data);
        break;
        
      case 'gameState':
        wx.eventCenter.trigger('gameState', data);
        break;
        
      case 'playerActed':
        wx.eventCenter.trigger('playerActed', data);
        break;
        
      case 'gameStage':
        wx.eventCenter.trigger('gameStage', data);
        break;
        
      case 'gameShowdown':
        wx.eventCenter.trigger('gameShowdown', data);
        break;
        
      case 'error':
        wx.showToast({
          title: data.message,
          icon: 'none'
        });
        break;
    }
  },
  
  // 登录
  login(userInfo) {
    if (!this.globalData.socket) {
      this.initSocket();
    }
    
    setTimeout(() => {
      if (this.globalData.socket) {
        this.globalData.socket.send({
          data: JSON.stringify({
            type: 'login',
            openid: userInfo.openid || userInfo.id,
            name: userInfo.nickName,
            avatar: userInfo.avatarUrl
          })
        });
      }
    }, 1000);
  },
  
  // 发送WebSocket消息
  sendSocketMessage(type, data) {
    if (this.globalData.socket) {
      this.globalData.socket.send({
        data: JSON.stringify({ type, ...data })
      });
    }
  }
});