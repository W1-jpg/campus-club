const { get } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    notices: [], loading: true,
    showDetail: false, currentNotice: {}
  },

  onShow() { this.loadNotices() },

  async loadNotices() {
    this.setData({ loading: true })
    try {
      const studentId = app.getUserId()
      const personalUrl = studentId ? '/api/notice/student/' + studentId : null
      // 并行加载系统通知和个人通知
      const [sysRes, personalRes] = await Promise.all([
        get('/api/notice/list').catch(() => ({ data: [] })),
        personalUrl ? get(personalUrl).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ])
      const all = [
        ...(sysRes.data || []).map(n => ({ ...n, _type: '系统' })),
        ...(personalRes.data || []).map(n => ({ ...n, _type: '个人' }))
      ]
      all.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      this.setData({
        notices: all.map(item => ({
          ...item,
          isRead: item.isRead !== undefined ? item.isRead : (item._type === '系统'), // 系统通知默认已读，个人通知默认未读
          _date: this.formatDate(item.createTime),
          _publisher: item.publisherType === 'teacher' ? '教师端' : (item.publisherType === 'system' ? '系统' : '管理员')
        }))
      })
    } catch (err) { console.error(err) }
    finally { this.setData({ loading: false }) }
  },

  viewDetail(e) {
    const item = e.currentTarget.dataset.item
    // 标记为已读
    if (!item.isRead) {
      const notices = this.data.notices.map(n =>
        n.id === item.id ? { ...n, isRead: true } : n
      )
      this.setData({ notices, showDetail: true, currentNotice: { ...item, isRead: true } })
    } else {
      this.setData({ showDetail: true, currentNotice: item })
    }
  },
  closeDetail() { this.setData({ showDetail: false }) },

  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }
})
