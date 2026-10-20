const { get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    list: [], filteredList: [], filterStatus: '', loading: true,
    statusFilters: [
      { value: '', label: '全部' },
      { value: '1', label: '孵化中' },
      { value: '2', label: '已完成' },
      { value: '3', label: '评审中' }
    ]
  },

  onShow() { this.loadList() },

  async loadList() {
    this.setData({ loading: true })
    try {
      const res = await get('/api/result/my', {
        studentId: app.getUserId(),
        userId: app.getUserId(),
        userType: wx.getStorageSync('userType') || 'student'
      })
      if (res.code === 200) {
        const list = (res.data || [])
          .filter(item => item.incubationStatus !== undefined || (item.incubationScore > 0) || item.reviewStatus >= 1)
          .map(item => this.formatItem(item))
        this.setData({ list })
        this.applyFilter()
      }
    } catch (err) { console.error(err) }
    finally { this.setData({ loading: false }) }
  },

  formatItem(item) {
    let statusText = '孵化中', statusColor = '#1890FF', statusBg = '#E8F4FD', progress = 60
    if (item.reviewStatus === 1) { statusText = '专家评审中'; statusColor = '#FAAD14'; statusBg = '#FFF8E6'; progress = 40 }
    else if (item.reviewStatus === 2) { statusText = '评审通过'; statusColor = '#52C41A'; statusBg = '#F0FBE6'; progress = 80 }
    else if (item.reviewStatus === 3) { statusText = '已打回'; statusColor = '#FF4D4F'; statusBg = '#FFF0F0'; progress = 10 }
    else if (item.incubationStatus === 2 || item.incubationScore > 0) { statusText = '已完成'; statusColor = '#52C41A'; statusBg = '#F0FBE6'; progress = 100 }
    return {
      ...item,
      _statusText: statusText, _progress: progress,
      _statusStyle: `color:${statusColor};background:${statusBg}`,
      _date: item.createTime ? new Date(item.createTime).toISOString().split('T')[0] : ''
    }
  },

  applyFilter() {
    const val = this.data.filterStatus
    let filtered = this.data.list
    if (val === '1') filtered = filtered.filter(i => i.incubationStatus === 1 && i.reviewStatus !== 1)
    else if (val === '2') filtered = filtered.filter(i => i.incubationStatus === 2 || i.incubationScore > 0)
    else if (val === '3') filtered = filtered.filter(i => i.reviewStatus === 1)
    this.setData({ filteredList: filtered })
  },

  onFilter(e) { this.setData({ filterStatus: e.currentTarget.dataset.value }); this.applyFilter() },
  goDetail(e) { wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id }) }
})
