# Daily Sentence - 每日一句英语学习小程序

一个基于微信小程序的每日英语学习应用，支持云端数据存储和用户收藏功能。

## ✨ 功能特性

- 📖 **每日英语句子** - 每天推送一条精选英语句子
- 🔊 **语音朗读** - 点击按钮即可听到标准发音
- 📚 **词汇解释** - 重点词汇配有音标和中文释义
- ⭐ **收藏功能** - 登录后可收藏喜欢的句子
- 📱 **收藏管理** - 查看、搜索和管理个人收藏
- ☁️ **云端同步** - 基于微信云开发，数据云端存储

## 🏗️ 技术架构

### 前端
- **框架**: 微信小程序原生开发
- **样式**: WXSS + 响应式设计
- **交互**: 微信小程序 API

### 后端
- **云服务**: 微信云开发
- **数据库**: 云数据库
- **云函数**: Node.js

### 数据库设计
- `users` - 用户信息表
- `daily_sentences` - 每日句子表
- `user_collections` - 用户收藏表
- `sentence_bank` - 句子库表

## 🚀 快速开始

### 1. 环境准备
- 安装微信开发者工具
- 申请小程序 AppID
- 开通微信云开发服务

### 2. 项目配置
1. 克隆项目到本地
2. 用微信开发者工具打开项目
3. 配置 AppID 和云开发环境ID

### 3. 云开发部署
1. 创建数据库集合：`users`, `daily_sentences`, `user_collections`, `sentence_bank`
2. 部署云函数：
   - `getTodaySentence` - 获取今日句子
   - `userLogin` - 用户登录
   - `manageCollection` - 收藏管理
   - `getUserCollections` - 获取用户收藏
   - `manageSentences` - 句子库管理

### 4. 初始化数据
在云开发控制台测试 `manageSentences` 云函数：
```json
{
  "action": "initSentenceBank"
}
```

## 📱 用户体验

### 无需登录即可使用
- 查看每日英语句子
- 听语音朗读
- 查看词汇解释

### 登录后额外功能
- 收藏喜欢的句子
- 管理个人收藏
- 云端数据同步

## 🔧 开发说明

### 项目结构
```
daily-english-miniprogram/
├── pages/                  # 页面文件
│   ├── index/             # 首页
│   ├── collection/        # 收藏页
│   └── detail/            # 详情页
├── utils/                 # 工具类
│   ├── audio.js          # 音频播放
│   └── cloud.js          # 云服务封装
├── cloudfunctions/        # 云函数
│   ├── getTodaySentence/  # 获取今日句子
│   ├── userLogin/         # 用户登录
│   ├── manageCollection/  # 收藏管理
│   ├── getUserCollections/# 获取收藏
│   └── manageSentences/   # 句子库管理
├── app.js                 # 小程序入口
├── app.json              # 小程序配置
└── app.wxss              # 全局样式
```

### 云函数说明
- **getTodaySentence**: 智能获取今日句子，优先从数据库句子库选择，备选内置句子
- **manageSentences**: 句子库管理，支持批量导入和统计
- **用户系统**: 完整的登录、收藏、数据同步功能

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！