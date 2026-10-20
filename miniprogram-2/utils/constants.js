// 全局常量配置
// 开发环境：本地 localhost；真机调试：改为电脑局域网 IP
// 生产环境发布前改为 HTTPS 域名
const getBaseUrl = () => {
  const saved = wx.getStorageSync('BASE_URL_OVERRIDE')
  if (saved) return saved
  return 'http://localhost:8080'
}

module.exports = {
  // API 基地址（可通过 storage 覆盖，支持真机调试）
  BASE_URL: getBaseUrl(),

  // 成果分类
  ACHIEVEMENT_TYPES: [
    '软件', '论文', '文创', '发明', '实践', '艺术', '创业', '竞赛', '调查', '其他'
  ],

  // 获奖等级
  AWARD_LEVELS: [
    { value: '国家级', emoji: '🇨🇳' },
    { value: '省级', emoji: '🏛️' },
    { value: '市级', emoji: '🏙️' },
    { value: '校级', emoji: '🏫' },
    { value: '院级', emoji: '📚' }
  ],

  // 资源类型
  RESOURCE_TYPES: ['资金支持', '导师指导', '场地提供', '设备支持', '技术合作', '实习机会'],

  RESOURCE_TYPE_ICONS: {
    '资金支持': '💰',
    '导师指导': '👨‍🏫',
    '场地提供': '🏢',
    '设备支持': '🔧',
    '技术合作': '💻',
    '实习机会': '🎯'
  },

  // 排序选项
  SORT_OPTIONS: [
    { key: 'default', label: '综合排序' },
    { key: 'newest', label: '最新发布' },
    { key: 'hottest', label: '点赞最多' },
    { key: 'score', label: '评分最高' }
  ],

  // 状态文本映射
  STATUS_MAP: {
    approved: { text: '已通过', color: '#52C41A' },
    pending: { text: '待审核', color: '#FAAD14' },
    rejected: { text: '已打回', color: '#FF4D4F' },
    incubating: { text: '孵化中', color: '#1890FF' },
    completed: { text: '已完成', color: '#52C41A' },
    reviewing: { text: '评审中', color: '#FAAD14' },
    cancelled: { text: '已取消', color: '#8F959E' }
  }
}
