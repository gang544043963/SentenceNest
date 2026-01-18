# ☁️ 微信云开发部署指南

## 🚀 快速开始

### 第一步：开通云开发服务

1. **在微信开发者工具中**：
   - 点击工具栏的"云开发"按钮 ☁️
   - 或者右键项目根目录 → "新建云开发环境"

2. **创建环境**：
   - 环境名称：`daily-english-dev`（开发环境）
   - 选择按量付费（有免费额度）
   - 点击"创建"

3. **获取环境ID**：
   - 创建完成后会显示环境ID，类似：`daily-english-xxx`
   - 复制这个环境ID

### 第二步：配置环境ID

修改 `utils/cloud.js` 文件第8行：
```javascript
wx.cloud.init({
  env: 'your-env-id', // 替换为你的实际环境ID
  traceUser: true
})
```

### 第三步：创建数据库集合

在云开发控制台的数据库中创建以下集合：

1. **users** - 用户信息表
2. **daily_sentences** - 每日句子表  
3. **user_collections** - 用户收藏表

### 第四步：部署云函数

在微信开发者工具中：

1. **右键 `cloudfunctions/getTodaySentence`** → "上传并部署：云端安装依赖"
2. **右键 `cloudfunctions/userLogin`** → "上传并部署：云端安装依赖"
3. **右键 `cloudfunctions/manageCollection`** → "上传并部署：云端安装依赖"
4. **右键 `cloudfunctions/getUserCollections`** → "上传并部署：云端安装依赖"

等待所有云函数部署完成（绿色✅图标）。

## 📊 数据库结构

### users 集合
```json
{
  "_id": "auto_generated",
  "openid": "用户openid",
  "nickName": "用户昵称",
  "avatarUrl": "头像URL",
  "createTime": "2024-01-08T10:00:00.000Z",
  "lastLoginTime": "2024-01-08T10:00:00.000Z",
  "totalCollections": 5,
  "consecutiveDays": 3,
  "totalStudyDays": 10
}
```

### daily_sentences 集合
```json
{
  "_id": "auto_generated",
  "date": "2024-01-08",
  "content": "The early bird catches the worm.",
  "translation": "早起的鸟儿有虫吃。",
  "keywords": [...],
  "createTime": "2024-01-08T00:00:00.000Z",
  "category": "daily",
  "difficulty": "medium"
}
```

### user_collections 集合
```json
{
  "_id": "auto_generated",
  "userId": "用户openid",
  "sentenceId": "句子ID",
  "sentence": {...},
  "collectedAt": "2024-01-08T10:30:00.000Z",
  "createTime": "2024-01-08T10:30:00.000Z"
}
```

## 🔧 测试云函数

### 1. 测试获取今日句子
在云开发控制台 → 云函数 → getTodaySentence → 测试：
```json
{}
```

### 2. 测试用户登录
```json
{
  "userInfo": {
    "nickName": "测试用户",
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

### 3. 测试收藏管理
```json
{
  "action": "add",
  "sentenceId": "sentence_id_here",
  "sentence": {
    "content": "Test sentence",
    "translation": "测试句子"
  }
}
```

## 🎯 前端集成

云函数部署完成后，小程序会自动使用云服务：

1. **首页**：自动从云端获取今日句子
2. **收藏功能**：数据保存到云数据库
3. **用户系统**：支持微信登录

## 💰 费用说明

### 免费额度（每月）
- **数据库**：读写 5万次，存储 2GB
- **云函数**：调用 10万次，资源使用量 4万GBs
- **云存储**：容量 5GB，下载操作 2万次
- **CDN**：流量 5GB

### 预估使用量（1000活跃用户）
- 数据库读写：约 2万次/月
- 云函数调用：约 1.5万次/月
- 存储空间：约 100MB

**结论**：完全在免费额度内！

## 🔍 调试技巧

### 1. 查看云函数日志
云开发控制台 → 云函数 → 选择函数 → 日志

### 2. 数据库调试
云开发控制台 → 数据库 → 选择集合 → 查看数据

### 3. 本地调试
```javascript
// 在小程序中调用云函数
wx.cloud.callFunction({
  name: 'getTodaySentence',
  success: console.log,
  fail: console.error
})
```

## ⚠️ 注意事项

1. **环境ID**：必须替换为实际的环境ID
2. **权限设置**：数据库默认权限为"仅创建者可读写"
3. **网络**：云函数调用需要网络连接
4. **AppID**：必须使用正式的小程序AppID（测试号不支持）

## 🎉 部署完成

部署成功后，你的小程序将拥有：
- ✅ 云端数据存储
- ✅ 用户登录系统  
- ✅ 服务端业务逻辑
- ✅ 自动扩容能力
- ✅ 免运维部署

恭喜！你已经拥有了一个完整的云端小程序！🎊