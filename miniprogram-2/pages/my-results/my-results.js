const { get, put, del } = require('../../utils/request')
const { ACHIEVEMENT_TYPES } = require('../../utils/constants')
const app = getApp()

Page({
  data: {
    list: [], filteredList: [], keyword: '', loading: true,
    showEdit: false, editForm: {}, editTypes: ACHIEVEMENT_TYPES
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
        const list = (res.data || []).map(item => this.formatItem(item))
        this.setData({ list })
        this.applyFilter()
      }
    } catch (err) { console.error(err) }
    finally { this.setData({ loading: false }) }
  },

  formatItem(item) {
    let statusText = '待评分', statusColor = '#FAAD14', statusBg = '#FFF8E6'
    if (item.reviewStatus === 3) { statusText = '已打回'; statusColor = '#FF4D4F'; statusBg = '#FFF0F0' }
    else if (item.incubationStatus === 1) { statusText = '孵化中'; statusColor = '#1890FF'; statusBg = '#E8F4FD' }
    else if (item.incubationStatus === 2 || item.incubationScore > 0) { statusText = '已完成'; statusColor = '#52C41A'; statusBg = '#F0FBE6' }
    else if (item.score) { statusText = '已评分'; statusColor = '#52C41A'; statusBg = '#F0FBE6' }
    else if (item.reviewStatus === 2) { statusText = '评审通过'; statusColor = '#52C41A'; statusBg = '#F0FBE6' }
    else if (item.reviewStatus === 1) { statusText = '待专家评审'; statusColor = '#1890FF'; statusBg = '#E8F4FD' }
    return {
      ...item,
      _statusText: statusText,
      _statusStyle: `color:${statusColor};background:${statusBg}`,
      _date: item.createTime ? new Date(item.createTime).toISOString().split('T')[0] : ''
    }
  },

  applyFilter() {
    const kw = this.data.keyword.toLowerCase()
    const filtered = kw
      ? this.data.list.filter(i => (i.title||'').toLowerCase().includes(kw) || (i.type||'').toLowerCase().includes(kw))
      : this.data.list
    this.setData({ filteredList: filtered })
  },

  onSearch(e) { this.setData({ keyword: e.detail.value }); this.applyFilter() },
  goDetail(e) { wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id }) },
  goUpload() { wx.navigateTo({ url: '/pages/upload/upload' }) },

  openEdit(e) {
    const item = e.currentTarget.dataset.item
    this.setData({ showEdit: true, editForm: { ...item } })
  },
  closeEdit() { this.setData({ showEdit: false }) },
  onEditInput(e) { const f = e.currentTarget.dataset.field; this.setData({ ['editForm.'+f]: e.detail.value }) },
  onEditType(e) { this.setData({ 'editForm.type': ACHIEVEMENT_TYPES[e.detail.value] }) },

  async submitEdit() {
    try {
      const res = await put('/api/result/update', this.data.editForm)
      if (res.code === 200) {
        wx.showToast({ title: '修改成功', icon: 'success' })
        this.setData({ showEdit: false })
        this.loadList()
      }
    } catch (err) { wx.showToast({ title: '修改失败', icon: 'none' }) }
  },

  async deleteItem(e) {
    const id = e.currentTarget.dataset.id
    const confirm = await new Promise(r => wx.showModal({ title: '确认删除', content: '删除后不可恢复', success: r }))
    if (!confirm.confirm) return
    try {
      await del('/api/result/delete/' + id)
      wx.showToast({ title: '已删除', icon: 'success' })
      this.loadList()
    } catch (err) { wx.showToast({ title: '删除失败', icon: 'none' }) }
  }
})
