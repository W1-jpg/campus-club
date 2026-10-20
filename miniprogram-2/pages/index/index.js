const { get } = require('../../utils/request')
const { ACHIEVEMENT_TYPES, SORT_OPTIONS } = require('../../utils/constants')
const app = getApp()

Page({
  data: {
    searchKeyword: '',
    filterType: '',
    sortBy: 'default',
    categories: ['全部', ...ACHIEVEMENT_TYPES],
    sortOptions: SORT_OPTIONS,
    list: [],
    filteredList: [],
    totalCount: 0,
    loading: true
  },

  onLoad() { this.loadList() },
  onShow() {
    // 仅首次需要加载，后续 onShow 不再重复请求
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh())
  },

  async loadList() {
    this.setData({ loading: true })
    try {
      const userType = wx.getStorageSync('userType') || 'student'
      const res = await get('/api/result/list', { userType }, { silent: true })
      if (res && res.code === 200) {
        const list = (res.data || []).map(item => this.formatItem(item))
        this.setData({ list }, () => this.applyFilters())
      }
    } catch (err) {
      // 后端未启动，使用示例数据展示 UI
      console.log('后端未连接，显示示例数据')
      const demoData = this.getDemoData()
      this.setData({ list: demoData }, () => this.applyFilters())
    } finally {
      this.setData({ loading: false })
    }
  },

  getDemoData() {
    const types = ['软件', '论文', '文创', '发明', '实践', '艺术', '创业', '竞赛']
    const titles = [
      '智能校园导航小程序', '基于深度学习的图像识别研究',
      '手工皮具文创设计', '环保节能路灯系统', '社区志愿服务平台',
      '校园二手交易平台', 'AI 辅助教学工具', '大学生心理健康调查'
    ]
    return titles.map((title, i) => ({
      id: i + 1,
      title,
      type: types[i],
      description: '这是一个示例成果，后端启动后将显示真实数据',
      college: '计算机学院',
      likeCount: Math.floor(Math.random() * 200),
      viewCount: Math.floor(Math.random() * 1000),
      commentCount: Math.floor(Math.random() * 30),
      score: (60 + Math.random() * 40).toFixed(1),
      createTime: new Date(Date.now() - i * 86400000).toISOString(),
      isNew: i < 3
    }))
  },

  formatItem(item) {
    const created = item.createTime ? new Date(item.createTime).getTime() : 0
    return {
      ...item,
      isNew: (Date.now() - created) < 7 * 24 * 60 * 60 * 1000,
      commentCount: item.comments ? item.comments.length : (item.commentCount || 0)
    }
  },

  applyFilters() {
    let items = [...this.data.list]
    const { filterType, searchKeyword, sortBy } = this.data
    if (filterType) items = items.filter(i => i.type === filterType)
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      items = items.filter(i =>
        (i.title || '').toLowerCase().includes(kw) ||
        (i.type || '').toLowerCase().includes(kw)
      )
    }
    if (sortBy === 'newest') items.sort((a, b) => (new Date(b.createTime || 0).getTime() || 0) - (new Date(a.createTime || 0).getTime() || 0))
    else if (sortBy === 'hottest') items.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0))
    else if (sortBy === 'score') items.sort((a, b) => (b.score || 0) - (a.score || 0))
    this.setData({ filteredList: items, totalCount: items.length })
  },

  onSearchInput(e) { this.setData({ searchKeyword: e.detail.value }); this.applyFilters() },
  onFilterTap(e) { const t = e.currentTarget.dataset.type; this.setData({ filterType: t === '全部' ? '' : t }); this.applyFilters() },
  onSortTap(e) { this.setData({ sortBy: e.currentTarget.dataset.key }); this.applyFilters() },
  goDetail(e) { wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id }) },
  onShareAppMessage() { return { title: '校园社团成果市场', path: '/pages/index/index' } }
})
