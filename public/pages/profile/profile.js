// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    userInfo: {},
    stats: {
      totalGames: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      winRate: 0,
      maxWinStreak: 0,
      maxPlayTime: 0,
      totalPlayTime: '0小时'
    }
  },

  onShow() {
    this.loadUserInfo();
    this.loadStats();
  },

  loadUserInfo() {
    const userInfo = app.globalData.userInfo || {};
    const player = app.globalData.player || {};
    
    this.setData({
      userInfo: {
        ...userInfo,
        id: player.id
      }
    });
  },

  loadStats() {
    // 从本地存储获取统计数据
    const statsStr = wx.getStorageSync('playerStats');
    if (statsStr) {
      const stats = JSON.parse(statsStr);
      
      // 计算胜率
      if (stats.totalGames > 0) {
        stats.winRate = Math.round((stats.wins / stats.totalGames) * 100);
      }
      
      // 格式化总游戏时长
      const hours = Math.floor(stats.totalPlayTime / 3600);
      stats.totalPlayTime = hours > 0 ? `${hours}小时` : `${Math.floor(stats.totalPlayTime / 60)}分钟`;
      
      // 最长持续时间
      const maxHours = Math.floor(stats.maxPlayTime / 3600);
      stats.maxPlayTime = maxHours > 0 ? `${maxHours}小时` : `${Math.floor(stats.maxPlayTime / 60)}分钟`;
      
      this.setData({ stats });
    } else {
      // 初始化统计数据
      this.setData({
        stats: {
          totalGames: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          winRate: 0,
          maxWinStreak: 0,
          maxPlayTime: 0,
          totalPlayTime: '0分钟'
        }
      });
    }
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('player');
          wx.removeStorageSync('playerStats');
          
          // 跳转回登录页
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  }
});