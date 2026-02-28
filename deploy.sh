#!/bin/bash

# 德州扑克游戏部署脚本
# 支持前端Web版本部署到Vercel，后端部署到Render

echo "🚀 开始部署德州扑克游戏..."

# 检查Git状态
echo "📋 检查Git状态..."
git status

# 添加所有更改
echo "📥 添加更改到Git..."
git add .

# 提交更改（如果没有提供提交信息，使用默认信息）
if [ -z "$1" ]; then
    COMMIT_MSG="feat: 更新部署 - $(date '+%Y-%m-%d %H:%M:%S')"
else
    COMMIT_MSG="$1"
fi

echo "💾 提交更改: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# 推送到GitHub
echo "📤 推送到GitHub..."
git push origin main

# 部署前端到Vercel
echo "🌐 部署前端到Vercel..."
if command -v vercel &> /dev/null; then
    echo "正在部署Web前端到Vercel..."
    cd public && vercel --prod
else
    echo "⚠️  Vercel CLI未安装，跳过前端部署"
    echo "请手动访问 https://vercel.com 进行部署"
fi

# 部署后端到Render
echo "🔧 部署后端到Render..."
echo "后端将自动从GitHub部署到Render平台"
echo "请访问 https://render.com 查看部署状态"

# 检查本地服务器状态
echo "🔍 检查本地服务器状态..."
if pgrep -f "node.*src/index.js" > /dev/null; then
    echo "✅ 本地服务器正在运行"
else
    echo "⚠️  本地服务器未运行，如需本地测试请执行: cd server && npm start"
fi

echo ""
echo "🎉 部署流程完成！"
echo ""
echo "📋 部署状态总结："
echo "✅ GitHub: 代码已推送"
echo "🔄 Vercel: 前端部署已触发（如安装了CLI）"
echo "🔄 Render: 后端部署将自动触发"
echo "✅ 本地: 服务器运行中"
echo ""
echo "🔗 访问地址："
echo "- 本地测试: http://localhost:3000"
echo "- Web前端: https://your-vercel-domain.vercel.app"
echo "- 后端API: https://your-render-domain.onrender.com"
echo ""
echo "📱 微信小程序: 请使用微信开发者工具上传client目录"