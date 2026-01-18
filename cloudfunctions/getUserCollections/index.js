// 获取用户收藏云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { page = 1, pageSize = 20, keyword = '' } = event
    
    console.log('获取用户收藏，openid:', wxContext.OPENID, 'page:', page, 'keyword:', keyword)
    
    // 构建查询条件
    let whereCondition = {
      userId: wxContext.OPENID
    }
    
    // 如果有搜索关键词，添加搜索条件
    if (keyword) {
      whereCondition = db.command.and([
        { userId: wxContext.OPENID },
        db.command.or([
          { 'sentence.content': db.RegExp({ regexp: keyword, options: 'i' }) },
          { 'sentence.translation': db.RegExp({ regexp: keyword, options: 'i' }) }
        ])
      ])
    }
    
    // 分页查询收藏列表
    const result = await db.collection('user_collections')
      .where(whereCondition)
      .orderBy('collectedAt', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()
    
    // 获取总数（用于分页）
    const countResult = await db.collection('user_collections')
      .where(whereCondition)
      .count()
    
    console.log('获取收藏成功，数量:', result.data.length, '总数:', countResult.total)
    
    return {
      success: true,
      data: result.data,
      pagination: {
        page: page,
        pageSize: pageSize,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / pageSize)
      }
    }
    
  } catch (error) {
    console.error('获取用户收藏失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}