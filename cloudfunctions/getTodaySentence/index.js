// 获取今日句子云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    console.log('获取今日句子，日期:', today)
    
    // 先查询是否已有今日句子
    const existingResult = await db.collection('daily_sentences')
      .where({
        date: today
      })
      .get()
    
    if (existingResult.data.length > 0) {
      console.log('找到今日句子:', existingResult.data[0])
      return {
        success: true,
        data: existingResult.data[0]
      }
    }
    
    // 如果没有今日句子，从句子库中选择一个
    let selectedSentence = null
    
    // 方法1：尝试从数据库句子库中获取
    try {
      const sentenceBankResult = await db.collection('sentence_bank')
        .where({
          isActive: true
        })
        .get()
      
      if (sentenceBankResult.data.length > 0) {
        // 根据日期生成随机索引，确保同一天总是返回相同的句子
        const dateNum = new Date(today).getTime()
        const randomIndex = Math.floor(dateNum / (1000 * 60 * 60 * 24)) % sentenceBankResult.data.length
        selectedSentence = sentenceBankResult.data[randomIndex]
        console.log('从数据库句子库中选择句子:', selectedSentence.content)
      }
    } catch (dbError) {
      console.log('数据库句子库查询失败，使用内置句子库:', dbError.message)
    }
    
    // 方法2：如果数据库没有句子，使用内置句子库作为备选
    if (!selectedSentence) {
      const fallbackSentences = [
        {
          content: "The early bird catches the worm.",
          translation: "早起的鸟儿有虫吃。",
          keywords: [
            { word: "early", phonetic: "/ˈɜːrli/", meaning: "早的，提前的", partOfSpeech: "adj." },
            { word: "catches", phonetic: "/ˈkætʃɪz/", meaning: "抓住，捕获", partOfSpeech: "v." },
            { word: "worm", phonetic: "/wɜːrm/", meaning: "虫子", partOfSpeech: "n." }
          ]
        },
        {
          content: "Practice makes perfect.",
          translation: "熟能生巧。",
          keywords: [
            { word: "practice", phonetic: "/ˈpræktɪs/", meaning: "练习，实践", partOfSpeech: "n./v." },
            { word: "perfect", phonetic: "/ˈpɜːrfɪkt/", meaning: "完美的", partOfSpeech: "adj." }
          ]
        },
        {
          content: "Time is money.",
          translation: "时间就是金钱。",
          keywords: [
            { word: "time", phonetic: "/taɪm/", meaning: "时间", partOfSpeech: "n." },
            { word: "money", phonetic: "/ˈmʌni/", meaning: "金钱", partOfSpeech: "n." }
          ]
        },
        {
          content: "Knowledge is power.",
          translation: "知识就是力量。",
          keywords: [
            { word: "knowledge", phonetic: "/ˈnɑːlɪdʒ/", meaning: "知识", partOfSpeech: "n." },
            { word: "power", phonetic: "/ˈpaʊər/", meaning: "力量，权力", partOfSpeech: "n." }
          ]
        },
        {
          content: "Actions speak louder than words.",
          translation: "行动胜过言语。",
          keywords: [
            { word: "actions", phonetic: "/ˈækʃənz/", meaning: "行动", partOfSpeech: "n." },
            { word: "louder", phonetic: "/ˈlaʊdər/", meaning: "更大声的", partOfSpeech: "adj." }
          ]
        },
        {
          content: "Where there is a will, there is a way.",
          translation: "有志者事竟成。",
          keywords: [
            { word: "will", phonetic: "/wɪl/", meaning: "意志，决心", partOfSpeech: "n." },
            { word: "way", phonetic: "/weɪ/", meaning: "方法，道路", partOfSpeech: "n." }
          ]
        },
        {
          content: "Rome wasn't built in a day.",
          translation: "罗马不是一天建成的。",
          keywords: [
            { word: "Rome", phonetic: "/roʊm/", meaning: "罗马", partOfSpeech: "n." },
            { word: "built", phonetic: "/bɪlt/", meaning: "建造", partOfSpeech: "v." }
          ]
        },
        {
          content: "Better late than never.",
          translation: "迟做总比不做好。",
          keywords: [
            { word: "better", phonetic: "/ˈbetər/", meaning: "更好的", partOfSpeech: "adj." },
            { word: "late", phonetic: "/leɪt/", meaning: "迟的", partOfSpeech: "adj." },
            { word: "never", phonetic: "/ˈnevər/", meaning: "从不", partOfSpeech: "adv." }
          ]
        },
        {
          content: "Every cloud has a silver lining.",
          translation: "黑暗中总有一线光明。",
          keywords: [
            { word: "cloud", phonetic: "/klaʊd/", meaning: "云", partOfSpeech: "n." },
            { word: "silver", phonetic: "/ˈsɪlvər/", meaning: "银色的", partOfSpeech: "adj." },
            { word: "lining", phonetic: "/ˈlaɪnɪŋ/", meaning: "内衬", partOfSpeech: "n." }
          ]
        },
        {
          content: "Don't judge a book by its cover.",
          translation: "不要以貌取人。",
          keywords: [
            { word: "judge", phonetic: "/dʒʌdʒ/", meaning: "判断", partOfSpeech: "v." },
            { word: "cover", phonetic: "/ˈkʌvər/", meaning: "封面", partOfSpeech: "n." }
          ]
        }
      ]
      
      const dateNum = new Date(today).getTime()
      const randomIndex = Math.floor(dateNum / (1000 * 60 * 60 * 24)) % fallbackSentences.length
      selectedSentence = fallbackSentences[randomIndex]
      console.log('使用内置句子库:', selectedSentence.content)
    }
    
    // 创建今日句子记录
    const todaySentence = {
      date: today,
      content: selectedSentence.content,
      translation: selectedSentence.translation,
      keywords: selectedSentence.keywords,
      category: selectedSentence.category || 'daily',
      difficulty: selectedSentence.difficulty || 'medium',
      source: selectedSentence.source || 'system',
      createTime: new Date()
    }
    
    // 保存到数据库
    const addResult = await db.collection('daily_sentences').add({
      data: todaySentence
    })
    
    console.log('创建今日句子成功:', addResult._id)
    
    return {
      success: true,
      data: {
        _id: addResult._id,
        ...todaySentence
      }
    }
    
  } catch (error) {
    console.error('获取今日句子失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}