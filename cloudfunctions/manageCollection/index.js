// 收藏管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { action, sentenceId, sentence } = event
    
    console.log('收藏操作:', action, 'sentenceId:', sentenceId, 'openid:', wxContext.OPENID)
    
    if (action === 'add') {
      // 添加收藏
      
      // 检查是否已收藏
      const existing = await db.collection('user_collections')
        .where({
          userId: wxContext.OPENID,
          sentenceId: sentenceId
        })
        .get()
      
      if (existing.data.length > 0) {
        return {
          success: false,
          error: '已经收藏过这个句子了'
        }
      }
      
      // 添加收藏记录
      const collectionData = {
        userId: wxContext.OPENID,
        sentenceId: sentenceId,
        sentence: sentence, // 冗余存储句子内容，便于查询
        collectedAt: new Date(),
        createTime: new Date()
      }
      
      const addResult = await db.collection('user_collections').add({
        data: collectionData
      })
      
      // 更新用户收藏总数
      await db.collection('users')
        .where({ openid: wxContext.OPENID })
        .update({
          data: {
            totalCollections: db.command.inc(1)
          }
        })
      
      console.log('添加收藏成功:', addResult._id)
      
      return {
        success: true,
        data: {
          _id: addResult._id,
          ...collectionData
        }
      }
      
    } else if (action === 'remove') {
      // 取消收藏
      
      const removeResult = await db.collection('user_collections')
        .where({
          userId: wxContext.OPENID,
          sentenceId: sentenceId
        })
        .remove()
      
      if (removeResult.stats.removed > 0) {
        // 更新用户收藏总数
        await db.collection('users')
          .where({ openid: wxContext.OPENID })
          .update({
            data: {
              totalCollections: db.command.inc(-1)
            }
          })
        
        console.log('取消收藏成功')
        
        return {
          success: true,
          removed: removeResult.stats.removed
        }
      } else {
        return {
          success: false,
          error: '收藏记录不存在'
        }
      }
      
    } else if (action === 'check') {
      // 检查收藏状态
      
      const result = await db.collection('user_collections')
        .where({
          userId: wxContext.OPENID,
          sentenceId: sentenceId
        })
        .get()
      
      return {
        success: true,
        isCollected: result.data.length > 0
      }
      
    } else {
      return {
        success: false,
        error: '不支持的操作类型'
      }
    }
    
  } catch (error) {
    console.error('收藏操作失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}