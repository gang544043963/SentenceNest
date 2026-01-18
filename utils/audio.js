// utils/audio.js - 音频工具类（简化版）

class AudioManager {
  constructor() {
    this.isPlaying = false
    this.audioContext = null
  }

  // 播放英语句子
  playEnglishSentence(text, callback = {}) {
    if (this.isPlaying) {
      console.log('正在播放中，请稍后再试')
      return false
    }

    this.isPlaying = true
    
    // 调用开始回调
    if (callback.onStart) {
      callback.onStart()
    }

    // 检查运行环境并选择合适的朗读方案
    this.selectPlaybackMethod(text, callback)
    
    return true
  }

  // 选择播放方案
  selectPlaybackMethod(text, callback) {
    try {
      // 获取系统信息（使用新API）
      const deviceInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : { platform: 'unknown' }
      const isDevTools = deviceInfo.platform === 'devtools'
      
      if (isDevTools) {
        // 开发者工具环境，使用模拟朗读
        console.log('检测到开发者工具环境，使用模拟朗读')
        this.simulatePlayback(text, callback)
      } else {
        // 真机环境，尝试使用在线TTS
        console.log('真机环境，尝试在线朗读')
        this.tryOnlineTTS(text, callback)
      }
    } catch (error) {
      console.log('环境检测失败，使用默认方案:', error)
      this.simulatePlayback(text, callback)
    }
  }

  // 模拟播放（开发环境）
  simulatePlayback(text, callback) {
    console.log('模拟语音播放:', text)
    
    // 根据文字长度计算播放时间
    const wordCount = text.split(' ').length
    const duration = Math.max(2500, wordCount * 400) // 每个单词约400ms
    
    setTimeout(() => {
      this.isPlaying = false
      if (callback.onEnd) {
        callback.onEnd()
      }
    }, duration)
  }

  // 在线TTS服务
  tryOnlineTTS(text, callback) {
    try {
      // 创建音频上下文
      this.audioContext = wx.createInnerAudioContext()
      
      // 使用在线TTS服务
      const ttsUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=1`
      
      this.audioContext.src = ttsUrl
      
      let hasStarted = false
      let hasEnded = false
      
      this.audioContext.onCanplay(() => {
        console.log('音频可以播放')
        if (!hasStarted && !hasEnded) {
          hasStarted = true
          this.audioContext.play()
        }
      })
      
      this.audioContext.onPlay(() => {
        console.log('在线TTS开始播放')
      })
      
      this.audioContext.onEnded(() => {
        console.log('在线TTS播放结束')
        if (!hasEnded) {
          hasEnded = true
          this.isPlaying = false
          if (callback.onEnd) {
            callback.onEnd()
          }
          this.cleanup()
        }
      })
      
      this.audioContext.onError((error) => {
        console.log('在线TTS播放失败:', error)
        if (!hasEnded) {
          hasEnded = true
          this.cleanup()
          // 降级到模拟播放
          this.simulatePlayback(text, callback)
        }
      })
      
      // 设置超时保护
      setTimeout(() => {
        if (this.isPlaying && !hasStarted && !hasEnded) {
          console.log('TTS加载超时，使用模拟播放')
          hasEnded = true
          this.cleanup()
          this.simulatePlayback(text, callback)
        }
      }, 5000)
      
    } catch (error) {
      console.log('在线TTS初始化失败:', error)
      this.simulatePlayback(text, callback)
    }
  }

  // 清理资源
  cleanup() {
    if (this.audioContext) {
      try {
        this.audioContext.destroy()
      } catch (error) {
        console.log('清理音频资源失败:', error)
      }
      this.audioContext = null
    }
    this.isPlaying = false
  }

  // 停止播放
  stop() {
    this.cleanup()
  }

  // 获取播放状态
  getPlayingStatus() {
    return this.isPlaying
  }

  // 获取环境信息
  getEnvironmentInfo() {
    try {
      const deviceInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : { platform: 'unknown' }
      return {
        platform: deviceInfo.platform,
        isDevTools: deviceInfo.platform === 'devtools'
      }
    } catch (error) {
      return {
        platform: 'unknown',
        isDevTools: false
      }
    }
  }
}

// 创建全局实例
const audioManager = new AudioManager()

module.exports = audioManager