// 用户登录云函数 - 标准微信登录流程
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { code, userInfo } = event
    
    console.log('用户登录请求，openid:', wxContext.OPENID)
    console.log('用户登录请求，appid:', wxContext.APPID)
    console.log('接收到的code:', code ? '已提供' : '未提供')
    console.log('接收到的userInfo:', userInfo ? '已提供' : '未提供')
    
    // 获取用户的openid和unionid
    let openid = wxContext.OPENID
    let unionid = wxContext.UNIONID
    
    if (!openid) {
      throw new Error('无法获取用户身份信息，请检查小程序配置')
    }
    
    console.log('用户身份信息 - openid:', openid, 'unionid:', unionid)
    
    // 查询用户是否已存在
    const existingUser = await db.collection('users')
      .where({
        openid: openid
      })
      .get()
    
    const now = new Date()
    
    if (existingUser.data.length > 0) {
      // 用户已存在，更新最后登录时间和用户信息
      const user = existingUser.data[0]
      
      const updateData = {
        lastLoginTime: now
      }
      
      // 如果提供了用户信息，更新用户资料
      if (userInfo) {
        updateData.nickName = userInfo.nickName
        updateData.avatarUrl = userInfo.avatarUrl
        updateData.gender = userInfo.gender
        updateData.city = userInfo.city
        updateData.province = userInfo.province
        updateData.country = userInfo.country
      }
      
      await db.collection('users').doc(user._id).update({
        data: updateData
      })
      
      console.log('老用户登录成功，更新信息')
      
      return {
        success: true,
        data: {
          ...user,
          ...updateData
        },
        isNewUser: false
      }
    } else {
      // 新用户，创建用户记录
      const newUser = {
        openid: openid,
        unionid: unionid,
        nickName: userInfo?.nickName || `英语学习者${openid.slice(-6)}`,
        avatarUrl: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0,
        city: userInfo?.city || '',
        province: userInfo?.province || '',
        country: userInfo?.country || '',
        createTime: now,
        lastLoginTime: now,
        totalCollections: 0,
        consecutiveDays: 1,
        totalStudyDays: 1,
        level: 'beginner',
        points: 0
      }
      
      const addResult = await db.collection('users').add({
        data: newUser
      })
      
      console.log('新用户注册成功:', addResult._id)
      
      return {
        success: true,
        data: {
          _id: addResult._id,
          ...newUser
        },
        isNewUser: true
      }
    }
    
  } catch (error) {
    console.error('用户登录失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}