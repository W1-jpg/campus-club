const { get, post } = require('../../utils/request')
const { RESOURCE_TYPES, RESOURCE_TYPE_ICONS } = require('../../utils/constants')
const app = getApp()

Page({
  data: {
    filterType: '',
    typeOptions: [
      { value: '', label: '全部', emoji: '📋' },
      ...RESOURCE_TYPES.map(t => ({ value: t, label: t, emoji: RESOURCE_TYPE_ICONS[t] || '📌' }))
    ],
    list: [], filteredList: [], loading: true,
    showApply: false, currentResource: {}, qualifiedProjects: [],
    applyForm: { projectTitle: '', projectId: '', reason: '' }, applyLoading: false
  },

  onShow() { this.loadList() },

  async loadList() {
    this.setData({ loading: true })
    try {
      const url = this.data.filterType
        ? '/api/resource/type/' + encodeURIComponent(this.data.filterType)
        : '/api/resource/list'
      const res = await get(url)
      if (res.code === 200) {
        const list = (res.data || []).map(item => ({
          ...item,
          _typeColor: this.getTypeColor(item.type)
        }))
        this.setData({ list, filteredList: list })
      }
    } catch (err) { console.error(err) }
    finally { this.setData({ loading: false }) }
  },

  getTypeColor(type) {
    const map = { '资金支持': '#FAAD14', '导师指导': '#2B5AED', '场地提供': '#52C41A', '设备支持': '#FF4D4F', '技术合作': '#7C5CFC', '实习机会': '#06B6D4' }
    return map[type] || '#8F959E'
  },

  async applyResource(e) {
    const item = e.currentTarget.dataset.item
    this.setData({ currentResource: item })
    // 检查双审资格
    try {
      const res = await get('/api/result/my', { studentId: app.getUserId() })
      const qualified = (res.data || []).filter(r => r.reviewStatus === 2 && r.expertReview >= 1)
      if (qualified.length === 0) {
        wx.showModal({
          title: '暂无申请资格',
          content: '需要成果通过教师评分(>80分)和专家评审(双审)后才能申请资源',
          confirmText: '知道了',
          showCancel: false
        })
        return
      }
      this.setData({ qualifiedProjects: qualified, showApply: true,
        applyForm: { projectTitle: qualified[0].title, projectId: qualified[0].id, reason: '' }
      })
    } catch (err) {
      wx.showToast({ title: '检查资格失败', icon: 'none' })
    }
  },

  onProjectChange(e) {
    const project = this.data.qualifiedProjects[e.detail.value]
    this.setData({ 'applyForm.projectTitle': project.title, 'applyForm.projectId': project.id })
  },
  onApplyInput(e) { this.setData({ 'applyForm.reason': e.detail.value }) },
  closeApply() { this.setData({ showApply: false }) },

  async submitApply() {
    const studentId = app.getUserId()
    if (!studentId) { wx.showToast({ title: '请先登录', icon: 'none' }); return }
    this.setData({ applyLoading: true })
    try {
      const res = await post('/api/resource/apply', {
        resourceId: this.data.currentResource.id,
        studentId,
        studentName: wx.getStorageSync('username') || '',
        studentCollege: wx.getStorageSync('college') || '',
        achievementId: this.data.applyForm.projectId,
        reason: this.data.applyForm.reason
      })
      if (res.code === 200) {
        wx.showToast({ title: '申请成功', icon: 'success' })
        this.setData({ showApply: false })
      }
    } catch (err) { wx.showToast({ title: err.msg || '申请失败', icon: 'none' }) }
    finally { this.setData({ applyLoading: false }) }
  },

  onFilter(e) {
    const val = e.currentTarget.dataset.value
    this.setData({ filterType: val }, () => this.loadList())
  }
})
