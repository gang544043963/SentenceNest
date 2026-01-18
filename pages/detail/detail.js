// pages/detail/detail.js
const audioManager = require('../../utils/audio.js')
const cloudService = require('../../utils/cloud.js')

Page({
  data: {
    sentence: null,
    isCollected: false,
    isPlaying: false,
    loading: true,
    fromPage: 'index', // 来源页面
    isLoggedIn: false
  },

  onLoad(options) {
    const { id, from } = options
    
    this.setData({
      fromPage: from || 'index'
    })
    
    this.checkLoginStatus()
    this.loadSentenceDetail(id)
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = cloudService.checkLoginStatus()
    this.setData({
      isLoggedIn: isLoggedIn
    })
  },

  // 加载句子详情
  async loadSentenceDetail(id) {
    // 移除重复的 wx.showLoading，使用页面内的loading状态

    try {
      let sentence = null
      
      if (this.data.fromPage === 'collection') {
        // 从收藏页面进入，需要从云端获取收藏详情
        if (this.data.isLoggedIn) {
          const collections = await cloudService.getUserCollections(1, 100)
          sentence = collections.collections.find(item => 
            (item.sentenceId || item._id) === id
          )
          if (sentence && sentence.sentence) {
            sentence = sentence.sentence
          }
        }
      } else {
        // 从首页进入，获取今日句子
        sentence = await cloudService.getTodaySentence()
      }
      
      if (sentence) {
        this.setData({
          sentence: sentence,
          loading: false
        })
        this.checkCollectionStatus()
      } else {
        // 降级到本地数据
        this.loadLocalFallback(id)
      }
      
    } catch (error) {
      console.error('加载句子详情失败:', error)
      this.loadLocalFallback(id)
    }
    // 移除 finally 中的 wx.hideLoading()，因为我们使用页面内的loading状态
  },

  // 本地数据降级方案
  loadLocalFallback(id) {
    let sentence = null
    
    if (this.data.fromPage === 'collection') {
      // 从收藏页面进入，从本地收藏列表中查找
      const collections = wx.getStorageSync('collections') || []
      sentence = collections.find(item => item.id === id)
    } else {
      // 从首页进入，获取本地今日句子
      sentence = wx.getStorageSync('todaySentence')
    }
    
    if (sentence) {
      this.setData({
        sentence: sentence,
        loading: false
      })
      this.checkCollectionStatus()
    } else {
      wx.showToast({
        title: '句子不存在',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 检查收藏状态
  async checkCollectionStatus() {
    if (!this.data.sentence || !this.data.sentence._id) {
      return
    }
    
    if (!this.data.isLoggedIn) {
      this.setData({ isCollected: false })
      return
    }

    try {
      const isCollected = await cloudService.checkCollectionStatus(this.data.sentence._id)
      this.setData({
        isCollected: isCollected
      })
    } catch (error) {
      console.error('检查收藏状态失败:', error)
      // 降级到本地检查
      const collections = wx.getStorageSync('collections') || []
      const isCollected = collections.some(item => item.id === this.data.sentence._id)
      this.setData({
        isCollected: isCollected
      })
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
      
      const result = await cloudService.login()
      
      this.setData({
        isLoggedIn: true
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
    // 检查登录状态
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '收藏功能需要登录，是否立即登录？',
        success: (res) => {
          if (res.confirm) {
            this.userLogin()
          }
        }
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
        await cloudService.removeCollection(sentence._id)
        
        this.setData({
          isCollected: false
        })
        
        wx.showToast({
          title: '已取消收藏',
          icon: 'none'
        })
      } else {
        // 添加收藏
        await cloudService.addCollection(sentence._id, sentence)
        
        this.setData({
          isCollected: true
        })
        
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

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: `英语句子：${this.data.sentence.content}`,
      path: '/pages/index/index'
    }
  }
})