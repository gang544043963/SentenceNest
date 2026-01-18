// pages/index/index.js
const audioManager = require('../../utils/audio.js')
const cloudService = require('../../utils/cloud.js')

Page({
  data: {
    sentence: null,
    isCollected: false,
    isPlaying: false,
    currentDate: '',
    loading: true,
    isLoggedIn: false,
    userInfo: null
  },

  onLoad() {
    console.log('页面加载开始')
    this.checkLoginStatus()
    this.loadTodaySentence()
    this.setCurrentDate()
  },

  onShow() {
    console.log('页面显示，当前句子:', this.data.sentence)
    // 每次显示页面时检查收藏状态
    if (this.data.sentence) {
      this.checkCollectionStatus()
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = cloudService.checkLoginStatus()
    const userInfo = cloudService.getCurrentUser()
    
    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: userInfo
    })
  },

  // 设置当前日期
  setCurrentDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const weekday = weekdays[now.getDay()]
    
    this.setData({
      currentDate: `${year}年${month}月${day}日 ${weekday}`
    })
  },

  // 加载今日句子
  async loadTodaySentence() {
    console.log('开始从云端加载今日句子')
    // 移除重复的 wx.showLoading，使用页面内的loading状态

    try {
      const sentence = await cloudService.getTodaySentence()
      console.log('获取到的云端句子数据:', sentence)
      console.log('句子ID字段检查 - _id:', sentence._id, 'id:', sentence.id)
      
      this.setData({
        sentence: sentence,
        loading: false
      })
      
      console.log('页面数据更新后，sentence:', this.data.sentence)
      
      // 检查收藏状态
      this.checkCollectionStatus()
      
    } catch (error) {
      console.error('加载今日句子失败:', error)
      wx.showToast({
        title: '加载失败，请检查网络',
        icon: 'none'
      })
      
      // 降级到本地数据
      this.loadLocalFallback()
    }
  },

  // 本地数据降级方案
  loadLocalFallback() {
    const localSentence = {
      _id: 'local_' + Date.now(),
      content: "The early bird catches the worm.",
      translation: "早起的鸟儿有虫吃。",
      keywords: [
        {
          word: "early",
          phonetic: "/ˈɜːrli/",
          meaning: "早的，提前的",
          partOfSpeech: "adj."
        },
        {
          word: "catches",
          phonetic: "/ˈkætʃɪz/",
          meaning: "抓住，捕获",
          partOfSpeech: "v."
        }
      ]
    }
    
    this.setData({
      sentence: localSentence,
      loading: false
    })
  },

  // 检查收藏状态
  async checkCollectionStatus() {
    console.log('检查收藏状态，当前句子:', this.data.sentence)
    if (!this.data.sentence) {
      console.log('句子数据为空')
      return
    }
    
    const sentenceId = this.data.sentence._id || this.data.sentence.id
    if (!sentenceId) {
      console.log('句子ID不存在，句子数据:', this.data.sentence)
      return
    }
    
    if (!this.data.isLoggedIn) {
      this.setData({ isCollected: false })
      return
    }

    try {
      const isCollected = await cloudService.checkCollectionStatus(sentenceId)
      console.log('收藏状态检查结果:', isCollected)
      this.setData({
        isCollected: isCollected
      })
    } catch (error) {
      console.error('检查收藏状态失败:', error)
    }
  },

  // 朗读句子
  playAudio() {
    if (this.data.isPlaying) {
      return
    }

    const success = audioManager.playEnglishSentence(this.data.sentence.content, {
      onStart: () => {
        this.setData({
          isPlaying: true
        })
      },
      onEnd: () => {
        this.setData({
          isPlaying: false
        })
      }
    })

    if (!success) {
      wx.showToast({
        title: '请稍后再试',
        icon: 'none'
      })
    }
  },

  // 用户登录 - 简化的微信登录体验
  async userLogin() {
    try {
      // 显示登录确认对话框
      const confirmResult = await this.showLoginConfirm()
      if (!confirmResult) {
        return // 用户取消登录
      }

      wx.showLoading({
        title: '微信登录中...'
      })
      
      // 执行微信登录（不需要用户信息授权）
      const result = await cloudService.login()
      
      this.setData({
        isLoggedIn: true,
        userInfo: result.user
      })
      
      wx.showToast({
        title: result.isNewUser ? '欢迎加入！' : '欢迎回来！',
        icon: 'success',
        duration: 2000
      })
      
      // 重新检查收藏状态
      this.checkCollectionStatus()
      
    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 3000
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 显示登录确认对话框
  showLoginConfirm() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '微信登录',
        content: '登录后可以收藏喜欢的句子，同步学习进度。',
        confirmText: '微信登录',
        cancelText: '暂不登录',
        success: (res) => {
          resolve(res.confirm)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
  },

  // 收藏/取消收藏
  async toggleCollection() {
    console.log('收藏按钮被点击')
    console.log('当前句子数据:', this.data.sentence)
    
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '收藏功能需要微信登录，登录后可以同步收藏到云端。',
        confirmText: '立即登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            this.userLogin()
          }
        }
      })
      return
    }
    
    // 检查句子数据是否完整
    if (!this.data.sentence) {
      console.log('句子数据为空')
      wx.showToast({
        title: '数据加载中，请稍后再试',
        icon: 'none'
      })
      return
    }

    const sentenceId = this.data.sentence._id || this.data.sentence.id
    if (!sentenceId) {
      console.log('句子ID不存在，句子数据:', this.data.sentence)
      wx.showToast({
        title: '句子数据异常，请刷新页面',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({
        title: this.data.isCollected ? '取消收藏中...' : '收藏中...'
      })

      const sentence = this.data.sentence
      const isCurrentlyCollected = this.data.isCollected

      if (isCurrentlyCollected) {
        // 取消收藏
        await cloudService.removeCollection(sentenceId)
        
        this.setData({
          isCollected: false
        })
        
        // 更新全局收藏缓存
        const app = getApp()
        app.collectionManager.updateCacheItem(sentenceId, 'remove')
        app.collectionManager.setNeedsRefresh()
        
        wx.showToast({
          title: '已取消收藏',
          icon: 'none'
        })
      } else {
        // 添加收藏
        await cloudService.addCollection(sentenceId, sentence)
        
        this.setData({
          isCollected: true
        })
        
        // 更新全局收藏缓存
        const app = getApp()
        app.collectionManager.updateCacheItem(sentenceId, 'add', sentence)
        app.collectionManager.setNeedsRefresh()
        
        wx.showToast({
          title: '收藏成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      wx.showToast({
        title: error.message || '操作失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `今日英语：${this.data.sentence.content}`,
      path: '/pages/index/index'
    }
  }
})