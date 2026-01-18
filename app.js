// app.js
const cloudService = require('./utils/cloud.js')

App({
  onLaunch() {
    // 小程序启动时初始化
    console.log('Daily English 小程序启动')
    
    // 初始化云开发
    cloudService.init()
    
    // 检查用户登录状态
    this.checkUserLogin()
  },

  // 检查用户登录状态
  checkUserLogin() {
    const isLoggedIn = cloudService.checkLoginStatus()
    console.log('用户登录状态:', isLoggedIn)
    
    if (isLoggedIn) {
      const user = cloudService.getCurrentUser()
      console.log('当前用户:', user.nickName)
    }
  },

  // 全局收藏状态管理
  collectionManager: {
    // 标记收藏数据是否需要刷新
    needsRefresh: false,
    
    // 设置需要刷新
    setNeedsRefresh() {
      this.needsRefresh = true
      console.log('收藏数据标记为需要刷新')
    },
    
    // 清除刷新标记
    clearRefreshFlag() {
      this.needsRefresh = false
      console.log('收藏数据刷新标记已清除')
    },
    
    // 检查是否需要刷新
    shouldRefresh() {
      return this.needsRefresh
    },
    
    // 更新本地缓存中的收藏状态
    updateCacheItem(sentenceId, action, sentenceData = null) {
      try {
        const collections = wx.getStorageSync('collections') || []
        
        if (action === 'add' && sentenceData) {
          // 添加收藏
          const newItem = {
            _id: Date.now().toString(),
            sentenceId: sentenceId,
            sentence: sentenceData,
            collectedAt: new Date().toISOString(),
            createTime: new Date().toISOString()
          }
          collections.unshift(newItem) // 添加到开头
          
        } else if (action === 'remove') {
          // 删除收藏
          const index = collections.findIndex(item => 
            (item.sentenceId || item._id) === sentenceId
          )
          if (index !== -1) {
            collections.splice(index, 1)
          }
        }
        
        // 更新缓存
        wx.setStorageSync('collections', collections)
        wx.setStorageSync('collectionsLoadTime', Date.now())
        
        console.log(`收藏缓存已更新: ${action} ${sentenceId}`)
        return collections
        
      } catch (error) {
        console.error('更新收藏缓存失败:', error)
        return null
      }
    }
  },

  globalData: {
    // 全局数据
    userInfo: null,
    isLoggedIn: false
  }
})