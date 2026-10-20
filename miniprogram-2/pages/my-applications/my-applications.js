const { get, put } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    list: [], filteredList: [], filterStatus: '', loading: true,
    statusFilters: [
      { value: '', label: '全部' },
      { value: '待审核', label: '待审核' },
      { value: '已通过', label: '已通过' },
      { value: '已拒绝', label: '已拒绝' }
    ]
  },

  onShow() { this.loadList() },

  async loadList() {
    this.setData({ loading: true })
    try {
      const studentId = app.getUserId()
      const userType = wx.getStorageSync('userType') || 'student'
      const res = await get('/api/resource/applications/' + userType + '/' + studentId)
      if (res.code === 200) {
        const list = (res.data || []).map(item => this.formatItem(item))
        this.setData({ list })
        this.applyFilter()
      }
    } catch (err) { console.error(err) }
    finally { this.setData({ loading: false }) }
  },

  formatItem(item) {
    let statusText = item.status || '待审核'
    let statusColor = '#FAAD14', statusBg = '#FFF8E6'
    if (statusText === '已通过') { statusColor = '#52C41A'; statusBg = '#F0FBE6' }
    else if (statusText === '已拒绝') { statusColor = '#FF4D4F'; statusBg = '#FFF0F0' }
    else if (statusText === '已取消') { statusColor = '#8F959E'; statusBg = '#F5F5F5' }
    return {
      ...item,
      _statusText: statusText,
      _statusStyle: `color:${statusColor};background:${statusBg}`,
      _date: item.applicationTime ? new Date(item.applicationTime).toISOString().split('T')[0] : ''
    }
  },

  applyFilter() {
    const val = this.data.filterStatus
    const filtered = val ? this.data.list.filter(i => (i.status || '待审核') === val) : this.data.list
    this.setData({ filteredList: filtered })
  },

  async cancelApplication(e) {
    const id = e.currentTarget.dataset.id
    const confirm = await new Promise(r => wx.showModal({ title: '确认取消', content: '确定要取消此申请吗？', success: r }))
    if (!confirm.confirm) return
    try {
      await put('/api/resource/applications/' + id + '/cancel')
      wx.showToast({ title: '已取消', icon: 'success' })
      this.loadList()
    } catch (err) { wx.showToast({ title: '操作失败', icon: 'none' }) }
  },

  onFilter(e) { this.setData({ filterStatus: e.currentTarget.dataset.value }); this.applyFilter() },
  goResource() { wx.switchTab({ url: '/pages/resource/resource' }) }
})
