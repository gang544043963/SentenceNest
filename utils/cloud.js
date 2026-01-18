// 云开发服务工具类
class CloudService {
  constructor() {
    this.isInitialized = false
    this.currentUser = null
  }

  // 初始化云开发
  init() {
    if (!this.isInitialized) {
      wx.cloud.init({
        env: 'cloud1-6gvyzxji4b964819', // 你的云开发环境ID
        traceUser: true
      })
      this.isInitialized = true
      console.log('云开发初始化完成')
    }
  }

  // 用户登录 - 标准微信登录流程（无需用户信息授权）
  async login() {
    try {
      this.init()
      
      console.log('开始微信登录流程...')
      
      // 获取微信登录凭证
      const loginResult = await this.wxLogin()
      console.log('微信登录凭证获取成功')
      
      // 调用云函数进行登录
      const result = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          code: loginResult.code
        }
      })
      
      console.log('云函数调用结果:', result)
      
      if (result.result && result.result.success) {
        this.currentUser = result.result.data
        
        // 保存用户信息到本地
        wx.setStorageSync('userInfo', this.currentUser)
        
        console.log('用户登录成功:', this.currentUser)
        
        return {
          success: true,
          user: this.currentUser,
          isNewUser: result.result.isNewUser
        }
      } else {
        const errorMsg = result.result ? result.result.error : '云函数调用失败'
        throw new Error(errorMsg)
      }
      
    } catch (error) {
      console.error('用户登录失败:', error)
      throw new Error(error.message || '登录失败，请重试')
    }
  }

  // 带用户信息的登录方法（用于用户主动提供信息时）
  async loginWithUserInfo(userInfo) {
    try {
      this.init()
      
      console.log('开始微信登录流程（含用户信息）...')
      console.log('用户信息:', userInfo)
      
      // 获取微信登录凭证
      const loginResult = await this.wxLogin()
      console.log('微信登录凭证获取成功')
      
      // 调用云函数进行登录，传入用户信息
      const result = await wx.cloud.callFunction({
        name: 'userLogin',
        data: {
          code: loginResult.code,
          userInfo: userInfo
        }
      })
      
      console.log('云函数调用结果:', result)
      
      if (result.result && result.result.success) {
        this.currentUser = result.result.data
        
        // 保存用户信息到本地
        wx.setStorageSync('userInfo', this.currentUser)
        
        console.log('用户登录成功（含用户信息）:', this.currentUser)
        
        return {
          success: true,
          user: this.currentUser,
          isNewUser: result.result.isNewUser
        }
      } else {
        const errorMsg = result.result ? result.result.error : '云函数调用失败'
        throw new Error(errorMsg)
      }
      
    } catch (error) {
      console.error('用户登录失败:', error)
      throw new Error(error.message || '登录失败，请重试')
    }
  }

  // 微信登录获取code
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res)
          } else {
            reject(new Error('获取微信登录凭证失败'))
          }
        },
        fail: (error) => {
          reject(new Error('微信登录失败：' + error.errMsg))
        }
      })
    })
  }

  // 检查登录状态
  checkLoginStatus() {
    if (!this.currentUser) {
      this.currentUser = wx.getStorageSync('userInfo')
    }
    return !!this.currentUser
  }

  // 获取当前用户信息
  getCurrentUser() {
    if (!this.currentUser) {
      this.currentUser = wx.getStorageSync('userInfo')
    }
    return this.currentUser
  }

  // 退出登录
  logout() {
    this.currentUser = null
    wx.removeStorageSync('userInfo')
    console.log('用户已退出登录')
  }

  // 获取今日句子
  async getTodaySentence() {
    try {
      this.init()
      
      const result = await wx.cloud.callFunction({
        name: 'getTodaySentence'
      })
      
      if (result.result.success) {
        console.log('获取今日句子成功:', result.result.data)
        return result.result.data
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('获取今日句子失败:', error)
      throw new Error('获取今日句子失败，请检查网络连接')
    }
  }

  // 添加收藏
  async addCollection(sentenceId, sentence) {
    try {
      this.init()
      
      if (!this.checkLoginStatus()) {
        throw new Error('请先登录')
      }
      
      const result = await wx.cloud.callFunction({
        name: 'manageCollection',
        data: {
          action: 'add',
          sentenceId: sentenceId,
          sentence: sentence
        }
      })
      
      if (result.result.success) {
        console.log('添加收藏成功')
        return result.result.data
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('添加收藏失败:', error)
      throw error
    }
  }

  // 取消收藏
  async removeCollection(sentenceId) {
    try {
      this.init()
      
      if (!this.checkLoginStatus()) {
        throw new Error('请先登录')
      }
      
      const result = await wx.cloud.callFunction({
        name: 'manageCollection',
        data: {
          action: 'remove',
          sentenceId: sentenceId
        }
      })
      
      if (result.result.success) {
        console.log('取消收藏成功')
        return true
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('取消收藏失败:', error)
      throw error
    }
  }

  // 检查收藏状态
  async checkCollectionStatus(sentenceId) {
    try {
      this.init()
      
      if (!this.checkLoginStatus()) {
        return false
      }
      
      const result = await wx.cloud.callFunction({
        name: 'manageCollection',
        data: {
          action: 'check',
          sentenceId: sentenceId
        }
      })
      
      if (result.result.success) {
        return result.result.isCollected
      } else {
        return false
      }
      
    } catch (error) {
      console.error('检查收藏状态失败:', error)
      return false
    }
  }

  // 获取用户收藏列表
  async getUserCollections(page = 1, pageSize = 20, keyword = '') {
    try {
      this.init()
      
      if (!this.checkLoginStatus()) {
        throw new Error('请先登录')
      }
      
      const result = await wx.cloud.callFunction({
        name: 'getUserCollections',
        data: {
          page: page,
          pageSize: pageSize,
          keyword: keyword
        }
      })
      
      if (result.result.success) {
        console.log('获取收藏列表成功，数量:', result.result.data.length)
        return {
          collections: result.result.data,
          pagination: result.result.pagination
        }
      } else {
        throw new Error(result.result.error)
      }
      
    } catch (error) {
      console.error('获取收藏列表失败:', error)
      throw new Error('获取收藏列表失败，请检查网络连接')
    }
  }

  // 网络状态检查
  async checkNetworkStatus() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          resolve(res.networkType !== 'none')
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  }
}

// 创建全局实例
const cloudService = new CloudService()

module.exports = cloudService