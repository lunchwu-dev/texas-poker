// pages/login/login.js
const app = getApp();

Page({
  data: {
    loading: false
  },
  
  onLoad() {
    // 检查是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.goToIndex();
    }
  },
  
  // 微信登录
  handleWechatLogin() {
    this.setData({ loading: true });
    
    // 获取用户信息
    wx.getUserProfile({
      desc: '用于完善游戏资料',
      success: (res) => {
        const userInfo = res.userInfo;
        this.setData({ loading: false });
        
        // 模拟openid（实际需要通过服务端获取）
        userInfo.openid = 'wx_' + Date.now();
        
        // 保存用户信息
        wx.setStorageSync('userInfo', userInfo);
        app.globalData.userInfo = userInfo;
        
        // 连接服务器并登录
        app.initSocket();
        
        // 延迟跳转，等待WebSocket连接
        setTimeout(() => {
          this.goToIndex();
        }, 1500);
      },
      fail: (err) => {
        this.setData({ loading: false });
        console.log('获取用户信息失败', err);
        // 允许游客登录
        this.handleGuestLogin();
      }
    });
  },
  
  // 获取手机号（需要企业微信或小程序绑定）
  getPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 处理手机号获取
      console.log('获取手机号成功', e.detail);
      this.handleWechatLogin();
    } else {
      console.log('用户拒绝获取手机号');
    }
  },
  
  // 游客登录
  handleGuestLogin() {
    const guestInfo = {
      id: 'guest_' + Date.now(),
      nickName: '游客' + Math.floor(Math.random() * 1000),
      avatarUrl: '',
      openid: 'guest_' + Date.now()
    };
    
    wx.setStorageSync('userInfo', guestInfo);
    app.globalData.userInfo = guestInfo;
    
    app.initSocket();
    
    setTimeout(() => {
      this.goToIndex();
    }, 1500);
  },
  
  goToIndex() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  }
});