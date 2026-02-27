# 德州扑克微信小程序 - 部署指南

## 项目简介

这是一个完整的德州扑克游戏解决方案，包含：
- **后端服务**：Node.js + Express + Socket.io
- **前端小程序**：微信小程序原生开发

## 功能特性

- ✅ 微信好友在线联网对战（最多6人/桌）
- ✅ 标准德州扑克规则
- ✅ 微信账户登录
- ✅ 比赛数据统计（场次、胜率、连胜等）
- ✅ 成就系统
- ✅ 简洁拟真画风

## 技术栈

### 后端
- Node.js 14+
- Express.js
- Socket.io
- UUID

### 前端
- 微信小程序原生开发
- WebSocket 实时通信

---

## 快速开始

### 1. 环境要求

- Node.js 14.0.0 或更高版本
- npm 或 yarn
- 微信开发者工具

### 2. 后端部署

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 启动服务
npm start
```

服务启动后默认运行在 `http://localhost:3000`

### 3. 前端配置

#### 3.1 配置服务器地址

打开 `client/app.js`，修改 WebSocket 连接地址：

```javascript
// 将 localhost 替换为你的服务器 IP 或域名
wx.connectSocket({
  url: 'ws://your-server-ip:3000'
});
```

#### 3.2 微信开发者工具配置

1. 打开微信开发者工具
2. 导入 `client` 目录
3. 在「详情」→「本地设置」中：
   - 勾选"不校验合法域名"
4. 在「详情」→「域名信息」中：
   - 设置「socket 合法域名」为你的服务器地址

#### 3.3 AppID 配置

如果你有正式的微信小程序 AppID：
1. 打开 `client/project.config.json`
2. 修改 `appid` 为你的 AppID

---

## 项目结构

```
texas-poker/
├── server/                 # 后端服务
│   ├── src/
│   │   └── index.js       # 主服务器文件
│   ├── package.json       # 后端依赖配置
│   └── README.md         # 后端说明
│
└── client/                # 微信小程序前端
    ├── app.js            # 应用入口
    ├── app.json          # 应用配置
    ├── app.wxss          # 全局样式
    ├── pages/
    │   ├── login/        # 登录页面
    │   ├── index/        # 大厅页面
    │   ├── room/         # 房间页面
    │   ├── game/         # 游戏页面
    │   └── profile/      # 个人中心页面
    └── project.config.json
```

---

## 游戏规则说明

### 基本规则

1. **牌型大小**（从大到小）：
   - 皇家同花顺 > 同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌

2. **下注轮次**：
   - 翻牌前（Preflop）
   - 翻牌圈（Flop）
   - 转牌圈（Turn）
   - 河牌圈（River）
   - 摊牌（Showdown）

3. **操作选项**：
   - 弃牌（Fold）：放弃当前手牌
   - 过牌（Check）：不下注跟进
   - 跟注（Call）：匹配当前下注
   - 加注（Raise）：增加下注金额
   - 全下（All-in）：押上所有筹码

### 游戏流程

1. 玩家加入房间
2. 至少2人开局
3. 系统发牌（每人2张底牌）
4. 进行四轮下注
5. 摊牌比牌
6. 结算并记录数据

---

## 数据统计

系统会自动记录以下数据：

| 数据项 | 说明 |
|-------|------|
| 总场次 | 完成的游戏总数 |
| 获胜次数 | 赢得底池的次数 |
| 失败次数 | 弃牌或输掉底池的次数 |
| 平局次数 | 多人平分底池的次数 |
| 胜率 | 获胜次数 / 总场次 × 100% |
| 最高连胜 | 连续获胜的最大场次 |
| 总游戏时长 | 累计游戏时间 |

---

## 常见问题

### 1. 连接不上服务器

- 检查服务器是否启动
- 检查 IP 地址和端口是否正确
- 确保防火墙允许 3000 端口

### 2. 无法登录

- 确保微信开发者工具已登录
- 检查是否勾选"不校验合法域名"

### 3. 游戏开始失败

- 确保房间内至少有2名玩家
- 房主点击"开始游戏"按钮

### 4. WebSocket 断线

- 网络不稳定时会自动重连
- 可在「我的」页面查看连接状态

---

## 生产环境部署

### 服务器建议配置

- CPU: 2核或以上
- 内存: 2GB 或以上
- 带宽: 5Mbps 或以上

### Nginx 配置（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 使用 PM2 运行

```bash
# 全局安装 PM2
npm install -g pm2

# 使用 PM2 启动服务
pm2 start server/src/index.js --name texas-poker

# 查看状态
pm2 status

# 查看日志
pm2 logs texas-poker
```

---

## 更新日志

### v1.0.0 (2024-01-01)
- 完成初始版本开发
- 支持6人在线对战
- 实现完整游戏逻辑
- 包含数据统计功能

---

## 联系支持

如有问题或建议，请联系开发团队。

---

## 许可证

仅供学习交流使用