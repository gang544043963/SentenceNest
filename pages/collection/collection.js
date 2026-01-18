// pages/collection/collection.js
const cloudService = require('../../utils/cloud.js')

Page({
  data: {
    collections: [],
    filteredCollections: [],
    searchValue: '',
    loading: true,
    isEmpty: false,
    isLoggedIn: false,
    currentPage: 1,
    hasMore: true,
    dataLoaded: false, // 标记数据是否已加载过
    lastLoadTime: 0    // 记录上次加载时间
  },

  onLoad() {
    this.checkLoginStatus()
    // 只在首次加载时显示loading
    this.loadCollections(true, true)
  },

  onShow() {
    // 检查登录状态
    this.checkLoginStatus()
    
    // 如果已登录，检查是否需要刷新数据
    if (this.data.isLoggedIn) {
      const app = getApp()
      const shouldRefresh = app.collectionManager.shouldRefresh()
      
      if (shouldRefresh) {
        console.log('检测到收藏数据变化，刷新页面数据')
        // 先从更新的缓存中加载数据，然后静默刷新
        this.loadFromUpdatedCache()
        // 静默从服务器刷新最新数据
        this.loadCollections(true, false)
        // 清除刷新标记
        app.collectionManager.clearRefreshFlag()
      } else {
        // 检查数据是否过期（超过5分钟）
        const now = Date.now()
        const shouldRefreshByTime = !this.data.dataLoaded || (now - this.data.lastLoadTime > 5 * 60 * 1000)
        
        if (shouldRefreshByTime) {
          this.loadCollections(true, false) // 静默刷新
        }
      }
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('用户下拉刷新')
    this.loadCollections(true, false).then(() => {
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    }).catch(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = cloudService.checkLoginStatus()
    this.setData({
      isLoggedIn: isLoggedIn
    })
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
      
      // 登录成功后加载收藏
      this.loadCollections()
      
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
        content: '登录后可以查看和管理收藏的句子。',
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

  // 加载收藏列表
  async loadCollections(isRefresh = true, showLoading = true) {
    if (!this.data.isLoggedIn) {
      this.setData({
        loading: false,
        isEmpty: true,
        dataLoaded: true
      })
      return
    }

    // 如果不是刷新操作且数据已加载过，直接返回
    if (!isRefresh && this.data.dataLoaded && this.data.collections.length > 0) {
      console.log('使用缓存数据，跳过加载')
      return
    }

    if (showLoading && isRefresh) {
      this.setData({
        currentPage: 1,
        hasMore: true,
        loading: true
      })
    } else if (isRefresh) {
      // 静默刷新，不显示loading
      this.setData({
        currentPage: 1,
        hasMore: true
      })
    }

    try {
      const result = await cloudService.getUserCollections(
        this.data.currentPage, 
        20, 
        this.data.searchValue
      )
      
      const newCollections = isRefresh ? result.collections : [...this.data.collections, ...result.collections]
      
      this.setData({
        collections: newCollections,
        filteredCollections: this.filterCollections(newCollections, this.data.searchValue),
        loading: false,
        isEmpty: newCollections.length === 0,
        hasMore: result.pagination && result.pagination.hasMore,
        currentPage: this.data.currentPage + 1,
        dataLoaded: true,
        lastLoadTime: Date.now()
      })
      
      // 缓存到本地存储
      wx.setStorageSync('collections', newCollections)
      wx.setStorageSync('collectionsLoadTime', Date.now())
      
      console.log('收藏数据加载完成，已缓存')
      
    } catch (error) {
      console.error('加载收藏列表失败:', error)
      
      // 如果网络失败，尝试使用本地缓存
      if (isRefresh) {
        this.loadFromCache()
      }
      
      wx.showToast({
        title: '加载失败，请检查网络',
        icon: 'none'
      })
    }
  },

  // 从更新的缓存加载数据（用于收藏状态变化后的即时更新）
  loadFromUpdatedCache() {
    try {
      const collections = wx.getStorageSync('collections') || []
      const cacheTime = wx.getStorageSync('collectionsLoadTime') || Date.now()
      
      console.log('从更新的缓存加载数据，数量:', collections.length)
      
      this.setData({
        collections: collections,
        filteredCollections: this.filterCollections(collections, this.data.searchValue),
        loading: false,
        isEmpty: collections.length === 0,
        dataLoaded: true,
        lastLoadTime: cacheTime
      })
      
      return true
    } catch (error) {
      console.error('从更新缓存加载失败:', error)
      return false
    }
  },

  // 过滤收藏数据（搜索功能）
  filterCollections(collections, searchValue) {
    if (!searchValue) {
      return collections
    }

    return collections.filter(item => {
      const sentence = item.sentence || item
      return sentence.content?.toLowerCase().includes(searchValue.toLowerCase()) ||
             sentence.translation?.toLowerCase().includes(searchValue.toLowerCase()) ||
             sentence.keywords?.some(keyword => 
               keyword.word?.toLowerCase().includes(searchValue.toLowerCase()) ||
               keyword.meaning?.toLowerCase().includes(searchValue.toLowerCase())
             )
    })
  },

  // 从本地缓存加载数据
  loadFromCache() {
    try {
      const cachedCollections = wx.getStorageSync('collections') || []
      const cacheTime = wx.getStorageSync('collectionsLoadTime') || 0
      const now = Date.now()
      
      // 如果缓存数据存在且不超过1小时，使用缓存
      if (cachedCollections.length > 0 && (now - cacheTime < 60 * 60 * 1000)) {
        console.log('使用本地缓存数据')
        this.setData({
          collections: cachedCollections,
          filteredCollections: this.filterCollections(cachedCollections, this.data.searchValue),
          loading: false,
          isEmpty: cachedCollections.length === 0,
          dataLoaded: true,
          lastLoadTime: cacheTime
        })
        return true
      }
    } catch (error) {
      console.error('读取缓存失败:', error)
    }
    
    // 缓存无效，显示空状态
    this.setData({
      collections: [],
      filteredCollections: [],
      loading: false,
      isEmpty: true,
      dataLoaded: true
    })
    return false
  },

  // 本地数据降级方案
  loadLocalFallback() {
    const collections = wx.getStorageSync('collections') || []
    this.setData({
      collections: collections,
      filteredCollections: collections,
      loading: false,
      isEmpty: collections.length === 0
    })
  },

  // 搜索功能
  onSearchInput(e) {
    const value = e.detail.value.toLowerCase()
    this.setData({
      searchValue: value
    })
    
    // 如果有缓存数据，先在本地过滤
    if (this.data.dataLoaded && this.data.collections.length > 0) {
      const filtered = this.filterCollections(this.data.collections, value)
      this.setData({
        filteredCollections: filtered,
        isEmpty: filtered.length === 0
      })
    } else {
      // 没有缓存数据，重新加载
      this.loadCollections(true, true)
    }
  },

  // 本地数据过滤（已移到上面的 filterCollections 方法）

  // 清空搜索
  clearSearch() {
    this.setData({
      searchValue: '',
      filteredCollections: this.data.collections,
      isEmpty: this.data.collections.length === 0
    })
  },

  // 点击收藏项，跳转到详情页
  onItemTap(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.filteredCollections[index]
    
    wx.navigateTo({
      url: `/pages/detail/detail?id=${item.sentenceId || item._id}&from=collection`
    })
  },

  // 删除收藏项
  deleteItem(e) {
    console.log('删除按钮被点击')
    const index = e.currentTarget.dataset.index
    const item = this.data.filteredCollections[index]
    
    console.log('要删除的项目:', item)
    console.log('索引:', index)
    
    if (!item) {
      console.error('未找到要删除的项目')
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      })
      return
    }
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条收藏吗？',
      success: (res) => {
        if (res.confirm) {
          this.removeFromCollection(item.sentenceId || item._id, index)
        }
      }
    })
  },

  // 从收藏中移除
  async removeFromCollection(sentenceId, index) {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({
        title: '删除中...'
      })

      await cloudService.removeCollection(sentenceId)
      
      // 更新页面数据
      const newCollections = [...this.data.collections]
      const newFilteredCollections = [...this.data.filteredCollections]
      
      newFilteredCollections.splice(index, 1)
      
      // 从原数组中也删除
      const originalIndex = newCollections.findIndex(item => 
        (item.sentenceId || item._id) === sentenceId
      )
      if (originalIndex !== -1) {
        newCollections.splice(originalIndex, 1)
      }
      
      this.setData({
        collections: newCollections,
        filteredCollections: newFilteredCollections,
        isEmpty: newCollections.length === 0
      })
      
      // 更新本地缓存和全局状态
      wx.setStorageSync('collections', newCollections)
      wx.setStorageSync('collectionsLoadTime', Date.now())
      
      // 通知全局状态管理器
      const app = getApp()
      app.collectionManager.setNeedsRefresh()
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      
    } catch (error) {
      console.error('删除收藏失败:', error)
      wx.showToast({
        title: error.message || '删除失败，请重试',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 格式化日期
  formatDate(dateString) {
    const date = new Date(dateString)
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}月${day}日`
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCollections(true)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && this.data.isLoggedIn) {
      this.loadCollections(false)
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: 'Daily Sentence - 我的英语收藏',
      path: '/pages/index/index'
    }
  }
})