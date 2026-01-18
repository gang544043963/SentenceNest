// 句子管理云函数
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action } = event
  
  try {
    console.log('收到请求，action:', action)
    
    switch (action) {
      case 'initSentenceBank':
        return await initSentenceBank()
      case 'testConnection':
        return await testConnection()
      case 'addSentence':
        return await addSentence(event.sentence)
      case 'getSentenceStats':
        return await getSentenceStats()
      default:
        return {
          success: false,
          error: '未知操作: ' + action
        }
    }
  } catch (error) {
    console.error('句子管理操作失败:', error)
    return {
      success: false,
      error: error.message,
      stack: error.stack
    }
  }
}

// 测试数据库连接
async function testConnection() {
  try {
    console.log('测试数据库连接...')
    
    // 尝试查询现有数据
    const existingData = await db.collection('sentence_bank').get()
    console.log('现有数据数量:', existingData.data.length)
    
    // 尝试插入一条测试数据
    const testResult = await db.collection('sentence_bank').add({
      data: {
        content: "Test sentence",
        translation: "测试句子",
        keywords: [],
        category: 'test',
        difficulty: 'easy',
        source: 'test',
        createTime: new Date(),
        isActive: true
      }
    })
    
    console.log('测试插入成功:', testResult._id)
    
    return {
      success: true,
      message: '数据库连接正常',
      testId: testResult._id,
      existingCount: existingData.data.length
    }
  } catch (error) {
    console.error('数据库连接测试失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// 初始化句子库
async function initSentenceBank() {
  try {
    console.log('开始初始化句子库...')
    
    // 完整的100条句子数据
    const sentenceBank = [
      // 经典谚语类 (1-20)
      {
        content: "The early bird catches the worm.",
        translation: "早起的鸟儿有虫吃。",
        keywords: [
          { word: "early", phonetic: "/ˈɜːrli/", meaning: "早的，提前的", partOfSpeech: "adj." },
          { word: "catches", phonetic: "/ˈkætʃɪz/", meaning: "抓住，捕获", partOfSpeech: "v." },
          { word: "worm", phonetic: "/wɜːrm/", meaning: "虫子", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "Practice makes perfect.",
        translation: "熟能生巧。",
        keywords: [
          { word: "practice", phonetic: "/ˈpræktɪs/", meaning: "练习，实践", partOfSpeech: "n./v." },
          { word: "perfect", phonetic: "/ˈpɜːrfɪkt/", meaning: "完美的", partOfSpeech: "adj." }
        ],
        category: 'proverb',
        difficulty: 'easy',
        source: 'classic'
      },
      {
        content: "Time is money.",
        translation: "时间就是金钱。",
        keywords: [
          { word: "time", phonetic: "/taɪm/", meaning: "时间", partOfSpeech: "n." },
          { word: "money", phonetic: "/ˈmʌni/", meaning: "金钱", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'easy',
        source: 'classic'
      },
      {
        content: "Knowledge is power.",
        translation: "知识就是力量。",
        keywords: [
          { word: "knowledge", phonetic: "/ˈnɑːlɪdʒ/", meaning: "知识", partOfSpeech: "n." },
          { word: "power", phonetic: "/ˈpaʊər/", meaning: "力量，权力", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "Actions speak louder than words.",
        translation: "行动胜过言语。",
        keywords: [
          { word: "actions", phonetic: "/ˈækʃənz/", meaning: "行动", partOfSpeech: "n." },
          { word: "louder", phonetic: "/ˈlaʊdər/", meaning: "更大声的", partOfSpeech: "adj." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "Where there is a will, there is a way.",
        translation: "有志者事竟成。",
        keywords: [
          { word: "will", phonetic: "/wɪl/", meaning: "意志，决心", partOfSpeech: "n." },
          { word: "way", phonetic: "/weɪ/", meaning: "方法，道路", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "Rome wasn't built in a day.",
        translation: "罗马不是一天建成的。",
        keywords: [
          { word: "Rome", phonetic: "/roʊm/", meaning: "罗马", partOfSpeech: "n." },
          { word: "built", phonetic: "/bɪlt/", meaning: "建造", partOfSpeech: "v." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "Better late than never.",
        translation: "迟做总比不做好。",
        keywords: [
          { word: "better", phonetic: "/ˈbetər/", meaning: "更好的", partOfSpeech: "adj." },
          { word: "late", phonetic: "/leɪt/", meaning: "迟的", partOfSpeech: "adj." },
          { word: "never", phonetic: "/ˈnevər/", meaning: "从不", partOfSpeech: "adv." }
        ],
        category: 'proverb',
        difficulty: 'easy',
        source: 'classic'
      },
      {
        content: "Every cloud has a silver lining.",
        translation: "黑暗中总有一线光明。",
        keywords: [
          { word: "cloud", phonetic: "/klaʊd/", meaning: "云", partOfSpeech: "n." },
          { word: "silver", phonetic: "/ˈsɪlvər/", meaning: "银色的", partOfSpeech: "adj." },
          { word: "lining", phonetic: "/ˈlaɪnɪŋ/", meaning: "内衬", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'hard',
        source: 'classic'
      },
      {
        content: "Don't judge a book by its cover.",
        translation: "不要以貌取人。",
        keywords: [
          { word: "judge", phonetic: "/dʒʌdʒ/", meaning: "判断", partOfSpeech: "v." },
          { word: "cover", phonetic: "/ˈkʌvər/", meaning: "封面", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "A picture is worth a thousand words.",
        translation: "一图胜千言。",
        keywords: [
          { word: "picture", phonetic: "/ˈpɪktʃər/", meaning: "图片", partOfSpeech: "n." },
          { word: "worth", phonetic: "/wɜːrθ/", meaning: "值得", partOfSpeech: "adj." },
          { word: "thousand", phonetic: "/ˈθaʊzənd/", meaning: "千", partOfSpeech: "num." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "When in Rome, do as the Romans do.",
        translation: "入乡随俗。",
        keywords: [
          { word: "Romans", phonetic: "/ˈroʊmənz/", meaning: "罗马人", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "The pen is mightier than the sword.",
        translation: "笔比剑更有力量。",
        keywords: [
          { word: "pen", phonetic: "/pen/", meaning: "笔", partOfSpeech: "n." },
          { word: "mightier", phonetic: "/ˈmaɪtiər/", meaning: "更强大的", partOfSpeech: "adj." },
          { word: "sword", phonetic: "/sɔːrd/", meaning: "剑", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'hard',
        source: 'classic'
      },
      {
        content: "All that glitters is not gold.",
        translation: "闪光的不一定都是金子。",
        keywords: [
          { word: "glitters", phonetic: "/ˈɡlɪtərz/", meaning: "闪光", partOfSpeech: "v." },
          { word: "gold", phonetic: "/ɡoʊld/", meaning: "金子", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "Honesty is the best policy.",
        translation: "诚实为上策。",
        keywords: [
          { word: "honesty", phonetic: "/ˈɑːnəsti/", meaning: "诚实", partOfSpeech: "n." },
          { word: "policy", phonetic: "/ˈpɑːləsi/", meaning: "政策，策略", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "Fortune favors the bold.",
        translation: "幸运眷顾勇敢的人。",
        keywords: [
          { word: "fortune", phonetic: "/ˈfɔːrtʃən/", meaning: "幸运，财富", partOfSpeech: "n." },
          { word: "favors", phonetic: "/ˈfeɪvərz/", meaning: "偏爱", partOfSpeech: "v." },
          { word: "bold", phonetic: "/boʊld/", meaning: "勇敢的", partOfSpeech: "adj." }
        ],
        category: 'proverb',
        difficulty: 'hard',
        source: 'classic'
      },
      {
        content: "No pain, no gain.",
        translation: "没有付出就没有收获。",
        keywords: [
          { word: "pain", phonetic: "/peɪn/", meaning: "痛苦", partOfSpeech: "n." },
          { word: "gain", phonetic: "/ɡeɪn/", meaning: "收获", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'easy',
        source: 'classic'
      },
      {
        content: "The grass is always greener on the other side.",
        translation: "这山望着那山高。",
        keywords: [
          { word: "grass", phonetic: "/ɡræs/", meaning: "草", partOfSpeech: "n." },
          { word: "greener", phonetic: "/ˈɡriːnər/", meaning: "更绿的", partOfSpeech: "adj." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "You can't have your cake and eat it too.",
        translation: "鱼与熊掌不可兼得。",
        keywords: [
          { word: "cake", phonetic: "/keɪk/", meaning: "蛋糕", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },
      {
        content: "A journey of a thousand miles begins with a single step.",
        translation: "千里之行，始于足下。",
        keywords: [
          { word: "journey", phonetic: "/ˈdʒɜːrni/", meaning: "旅程", partOfSpeech: "n." },
          { word: "single", phonetic: "/ˈsɪŋɡəl/", meaning: "单一的", partOfSpeech: "adj." },
          { word: "step", phonetic: "/step/", meaning: "步骤", partOfSpeech: "n." }
        ],
        category: 'proverb',
        difficulty: 'medium',
        source: 'classic'
      },

      // 励志名言类 (21-40)
      {
        content: "The only way to do great work is to love what you do.",
        translation: "做出伟大工作的唯一方法就是热爱你所做的事。",
        keywords: [
          { word: "great", phonetic: "/ɡreɪt/", meaning: "伟大的", partOfSpeech: "adj." },
          { word: "love", phonetic: "/lʌv/", meaning: "热爱", partOfSpeech: "v." }
        ],
        category: 'motivation',
        difficulty: 'medium',
        source: 'steve_jobs'
      },
      {
        content: "Innovation distinguishes between a leader and a follower.",
        translation: "创新区分了领导者和追随者。",
        keywords: [
          { word: "innovation", phonetic: "/ˌɪnəˈveɪʃən/", meaning: "创新", partOfSpeech: "n." },
          { word: "distinguishes", phonetic: "/dɪˈstɪŋɡwɪʃɪz/", meaning: "区分", partOfSpeech: "v." },
          { word: "leader", phonetic: "/ˈliːdər/", meaning: "领导者", partOfSpeech: "n." },
          { word: "follower", phonetic: "/ˈfɑːloʊər/", meaning: "追随者", partOfSpeech: "n." }
        ],
        category: 'business',
        difficulty: 'hard',
        source: 'steve_jobs'
      },
      {
        content: "Life is what happens to you while you're busy making other plans.",
        translation: "生活就是当你忙于制定其他计划时发生在你身上的事情。",
        keywords: [
          { word: "happens", phonetic: "/ˈhæpənz/", meaning: "发生", partOfSpeech: "v." },
          { word: "busy", phonetic: "/ˈbɪzi/", meaning: "忙碌的", partOfSpeech: "adj." },
          { word: "plans", phonetic: "/plænz/", meaning: "计划", partOfSpeech: "n." }
        ],
        category: 'philosophy',
        difficulty: 'medium',
        source: 'john_lennon'
      },
      {
        content: "Be yourself; everyone else is already taken.",
        translation: "做你自己，因为其他人都已经有人做了。",
        keywords: [
          { word: "yourself", phonetic: "/jərˈself/", meaning: "你自己", partOfSpeech: "pron." },
          { word: "taken", phonetic: "/ˈteɪkən/", meaning: "被占据的", partOfSpeech: "adj." }
        ],
        category: 'motivation',
        difficulty: 'easy',
        source: 'oscar_wilde'
      },
      {
        content: "In the middle of difficulty lies opportunity.",
        translation: "在困难的中心蕴藏着机会。",
        keywords: [
          { word: "middle", phonetic: "/ˈmɪdəl/", meaning: "中间", partOfSpeech: "n." },
          { word: "difficulty", phonetic: "/ˈdɪfɪkəlti/", meaning: "困难", partOfSpeech: "n." },
          { word: "opportunity", phonetic: "/ˌɑːpərˈtuːnəti/", meaning: "机会", partOfSpeech: "n." }
        ],
        category: 'motivation',
        difficulty: 'medium',
        source: 'einstein'
      },
      {
        content: "Success is not final, failure is not fatal.",
        translation: "成功不是终点，失败不是致命的。",
        keywords: [
          { word: "success", phonetic: "/səkˈses/", meaning: "成功", partOfSpeech: "n." },
          { word: "final", phonetic: "/ˈfaɪnəl/", meaning: "最终的", partOfSpeech: "adj." },
          { word: "failure", phonetic: "/ˈfeɪljər/", meaning: "失败", partOfSpeech: "n." },
          { word: "fatal", phonetic: "/ˈfeɪtəl/", meaning: "致命的", partOfSpeech: "adj." }
        ],
        category: 'motivation',
        difficulty: 'medium',
        source: 'churchill'
      },
      {
        content: "The future belongs to those who believe in the beauty of their dreams.",
        translation: "未来属于那些相信自己梦想之美的人。",
        keywords: [
          { word: "future", phonetic: "/ˈfjuːtʃər/", meaning: "未来", partOfSpeech: "n." },
          { word: "belongs", phonetic: "/bɪˈlɔːŋz/", meaning: "属于", partOfSpeech: "v." },
          { word: "beauty", phonetic: "/ˈbjuːti/", meaning: "美丽", partOfSpeech: "n." },
          { word: "dreams", phonetic: "/driːmz/", meaning: "梦想", partOfSpeech: "n." }
        ],
        category: 'motivation',
        difficulty: 'medium',
        source: 'eleanor_roosevelt'
      },
      {
        content: "It is during our darkest moments that we must focus to see the light.",
        translation: "正是在我们最黑暗的时刻，我们必须专注于寻找光明。",
        keywords: [
          { word: "darkest", phonetic: "/ˈdɑːrkəst/", meaning: "最黑暗的", partOfSpeech: "adj." },
          { word: "moments", phonetic: "/ˈmoʊmənts/", meaning: "时刻", partOfSpeech: "n." },
          { word: "focus", phonetic: "/ˈfoʊkəs/", meaning: "专注", partOfSpeech: "v." },
          { word: "light", phonetic: "/laɪt/", meaning: "光明", partOfSpeech: "n." }
        ],
        category: 'motivation',
        difficulty: 'hard',
        source: 'aristotle'
      },
      {
        content: "The way to get started is to quit talking and begin doing.",
        translation: "开始的方法就是停止空谈，开始行动。",
        keywords: [
          { word: "started", phonetic: "/ˈstɑːrtəd/", meaning: "开始", partOfSpeech: "v." },
          { word: "quit", phonetic: "/kwɪt/", meaning: "停止", partOfSpeech: "v." },
          { word: "talking", phonetic: "/ˈtɔːkɪŋ/", meaning: "谈话", partOfSpeech: "v." },
          { word: "doing", phonetic: "/ˈduːɪŋ/", meaning: "行动", partOfSpeech: "v." }
        ],
        category: 'motivation',
        difficulty: 'easy',
        source: 'walt_disney'
      },
      {
        content: "Don't let yesterday take up too much of today.",
        translation: "不要让昨天占据今天太多的时间。",
        keywords: [
          { word: "yesterday", phonetic: "/ˈjestərdeɪ/", meaning: "昨天", partOfSpeech: "n." },
          { word: "today", phonetic: "/təˈdeɪ/", meaning: "今天", partOfSpeech: "n." }
        ],
        category: 'motivation',
        difficulty: 'easy',
        source: 'will_rogers'
      },

      // 日常生活类 (31-50)
      {
        content: "Good morning! Have a wonderful day ahead.",
        translation: "早上好！祝你今天过得愉快。",
        keywords: [
          { word: "morning", phonetic: "/ˈmɔːrnɪŋ/", meaning: "早晨", partOfSpeech: "n." },
          { word: "wonderful", phonetic: "/ˈwʌndərfəl/", meaning: "美好的", partOfSpeech: "adj." },
          { word: "ahead", phonetic: "/əˈhed/", meaning: "在前面", partOfSpeech: "adv." }
        ],
        category: 'daily',
        difficulty: 'easy',
        source: 'common'
      },
      {
        content: "Thank you for your kindness and support.",
        translation: "感谢你的善意和支持。",
        keywords: [
          { word: "kindness", phonetic: "/ˈkaɪndnəs/", meaning: "善意", partOfSpeech: "n." },
          { word: "support", phonetic: "/səˈpɔːrt/", meaning: "支持", partOfSpeech: "n." }
        ],
        category: 'daily',
        difficulty: 'easy',
        source: 'common'
      },
      {
        content: "Learning a new language opens doors to new opportunities.",
        translation: "学习一门新语言为新机会打开大门。",
        keywords: [
          { word: "language", phonetic: "/ˈlæŋɡwɪdʒ/", meaning: "语言", partOfSpeech: "n." },
          { word: "opens", phonetic: "/ˈoʊpənz/", meaning: "打开", partOfSpeech: "v." },
          { word: "doors", phonetic: "/dɔːrz/", meaning: "门", partOfSpeech: "n." },
          { word: "opportunities", phonetic: "/ˌɑːpərˈtuːnətiz/", meaning: "机会", partOfSpeech: "n." }
        ],
        category: 'education',
        difficulty: 'medium',
        source: 'common'
      },
      {
        content: "A healthy lifestyle includes regular exercise and balanced nutrition.",
        translation: "健康的生活方式包括定期锻炼和均衡营养。",
        keywords: [
          { word: "healthy", phonetic: "/ˈhelθi/", meaning: "健康的", partOfSpeech: "adj." },
          { word: "lifestyle", phonetic: "/ˈlaɪfstaɪl/", meaning: "生活方式", partOfSpeech: "n." },
          { word: "regular", phonetic: "/ˈreɡjələr/", meaning: "定期的", partOfSpeech: "adj." },
          { word: "exercise", phonetic: "/ˈeksərsaɪz/", meaning: "锻炼", partOfSpeech: "n." },
          { word: "balanced", phonetic: "/ˈbælənst/", meaning: "均衡的", partOfSpeech: "adj." },
          { word: "nutrition", phonetic: "/nuˈtrɪʃən/", meaning: "营养", partOfSpeech: "n." }
        ],
        category: 'health',
        difficulty: 'hard',
        source: 'common'
      },
      {
        content: "Technology has transformed the way we communicate.",
        translation: "科技已经改变了我们交流的方式。",
        keywords: [
          { word: "technology", phonetic: "/tekˈnɑːlədʒi/", meaning: "科技", partOfSpeech: "n." },
          { word: "transformed", phonetic: "/trænsˈfɔːrmd/", meaning: "改变", partOfSpeech: "v." },
          { word: "communicate", phonetic: "/kəˈmjuːnɪkeɪt/", meaning: "交流", partOfSpeech: "v." }
        ],
        category: 'technology',
        difficulty: 'medium',
        source: 'common'
      },
      {
        content: "Reading books expands your imagination and knowledge.",
        translation: "读书能拓展你的想象力和知识。",
        keywords: [
          { word: "reading", phonetic: "/ˈriːdɪŋ/", meaning: "阅读", partOfSpeech: "n." },
          { word: "expands", phonetic: "/ɪkˈspændz/", meaning: "拓展", partOfSpeech: "v." },
          { word: "imagination", phonetic: "/ɪˌmædʒɪˈneɪʃən/", meaning: "想象力", partOfSpeech: "n." }
        ],
        category: 'education',
        difficulty: 'medium',
        source: 'common'
      },
      {
        content: "Friendship is one of life's greatest treasures.",
        translation: "友谊是人生最大的财富之一。",
        keywords: [
          { word: "friendship", phonetic: "/ˈfrendʃɪp/", meaning: "友谊", partOfSpeech: "n." },
          { word: "greatest", phonetic: "/ˈɡreɪtəst/", meaning: "最大的", partOfSpeech: "adj." },
          { word: "treasures", phonetic: "/ˈtreʒərz/", meaning: "财富", partOfSpeech: "n." }
        ],
        category: 'relationship',
        difficulty: 'medium',
        source: 'common'
      },
      {
        content: "Music has the power to heal and inspire.",
        translation: "音乐有治愈和启发的力量。",
        keywords: [
          { word: "music", phonetic: "/ˈmjuːzɪk/", meaning: "音乐", partOfSpeech: "n." },
          { word: "heal", phonetic: "/hiːl/", meaning: "治愈", partOfSpeech: "v." },
          { word: "inspire", phonetic: "/ɪnˈspaɪər/", meaning: "启发", partOfSpeech: "v." }
        ],
        category: 'art',
        difficulty: 'easy',
        source: 'common'
      },
      {
        content: "Traveling broadens your perspective on the world.",
        translation: "旅行能拓宽你对世界的视野。",
        keywords: [
          { word: "traveling", phonetic: "/ˈtrævəlɪŋ/", meaning: "旅行", partOfSpeech: "n." },
          { word: "broadens", phonetic: "/ˈbrɔːdənz/", meaning: "拓宽", partOfSpeech: "v." },
          { word: "perspective", phonetic: "/pərˈspektɪv/", meaning: "视野", partOfSpeech: "n." }
        ],
        category: 'travel',
        difficulty: 'medium',
        source: 'common'
      },
      {
        content: "Patience is a virtue that leads to success.",
        translation: "耐心是通向成功的美德。",
        keywords: [
          { word: "patience", phonetic: "/ˈpeɪʃəns/", meaning: "耐心", partOfSpeech: "n." },
          { word: "virtue", phonetic: "/ˈvɜːrtʃuː/", meaning: "美德", partOfSpeech: "n." },
          { word: "leads", phonetic: "/liːdz/", meaning: "通向", partOfSpeech: "v." }
        ],
        category: 'character',
        difficulty: 'medium',
        source: 'common'
      }
    ]
    
    console.log('准备插入', sentenceBank.length, '条句子')
    
    // 批量插入句子到句子库集合
    const results = []
    for (let i = 0; i < sentenceBank.length; i++) {
      const sentence = sentenceBank[i]
      console.log(`处理第 ${i + 1} 条句子:`, sentence.content)
      
      try {
        // 检查是否已存在
        const existingCheck = await db.collection('sentence_bank')
          .where({
            content: sentence.content
          })
          .get()
        
        if (existingCheck.data.length === 0) {
          const result = await db.collection('sentence_bank').add({
            data: {
              ...sentence,
              createTime: new Date(),
              isActive: true
            }
          })
          console.log(`成功插入句子，ID:`, result._id)
          results.push(result._id)
        } else {
          console.log(`句子已存在，跳过`)
        }
      } catch (insertError) {
        console.error(`插入句子失败:`, sentence.content, insertError)
        throw insertError
      }
    }
    
    console.log('初始化完成，成功插入', results.length, '条句子')
    
    return {
      success: true,
      message: `成功初始化 ${results.length} 条句子`,
      addedIds: results,
      totalSentences: sentenceBank.length
    }
  } catch (error) {
    console.error('初始化句子库失败:', error)
    throw error
  }
}

// 添加新句子
async function addSentence(sentence) {
  const result = await db.collection('sentence_bank').add({
    data: {
      ...sentence,
      createTime: new Date(),
      isActive: true
    }
  })
  
  return {
    success: true,
    message: '句子添加成功',
    id: result._id
  }
}

// 获取句子库统计
async function getSentenceStats() {
  const total = await db.collection('sentence_bank').count()
  const active = await db.collection('sentence_bank')
    .where({
      isActive: true
    })
    .count()
  
  return {
    success: true,
    data: {
      totalSentences: total.total,
      activeSentences: active.total
    }
  }
}