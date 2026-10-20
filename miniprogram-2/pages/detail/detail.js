const { get, post } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    result: null,
    activeTab: 'detail',
    tabs: [
      { key: 'detail', label: '项目详情' },
      { key: 'files', label: '文件资料' },
      { key: 'comments', label: '评论(0)' }
    ],
    starIndices: [1, 2, 3, 4, 5],
    files: [],
    comments: [],
    commentCount: 0,
    commentText: '',
    commentLoading: false,
    scoreStars: 0
  },

  onLoad(options) {
    if (options.id) this.loadDetail(options.id)
  },

  async loadDetail(id) {
    try {
      // 本地模拟 + API 调用
      const res = await get('/api/result/detail/' + id)
      if (res.code === 200) {
        const result = res.data
        // 合并文件
        const files = [
          ...(result.files || []),
          ...(result.clubFiles || []),
          ...(result.achievementFiles || [])
        ]
        const formatDate = this.formatDate
        const comments = (result.comments || []).map(c => ({
          ...c,
          _avatarChar: (c.userType || '?').charAt(0).toUpperCase(),
          _date: formatDate(c.createTime)
        }))
        this.setData({
          result: { ...result, _date: formatDate(result.createTime) },
          files,
          comments,
          commentCount: comments.length,
          tabs: [
            { key: 'detail', label: '项目详情' },
            { key: 'files', label: '文件资料' },
            { key: 'comments', label: `评论(${comments.length})` }
          ],
          scoreStars: result.score ? Math.round(result.score / 20) : 0
        })
      }
    } catch (err) {
      console.error('加载详情失败:', err)
      // 降级：展示模拟数据
      this.setData({
        result: {
          id, title: '软件测试实验报告', type: '软件',
          description: '一份完整的软件测试实验报告，包含测试计划、用例与结果。',
          studentId: 1, createTime: new Date().toISOString(),
          likeCount: 5, score: 85.5, college: '计算机学院',
          files: [{ id: 1, name: '测试报告.docx' }]
        },
        files: [{ id: 1, name: '测试报告.docx' }],
        scoreStars: 4
      })
    }
  },

  // 点赞（加入防抖，避免快速双击导致状态不一致）
  likePending: false,
  async handleLike() {
    if (this.likePending) return
    this.likePending = true
    const userId = app.getUserId()
    const userType = wx.getStorageSync('userType') || 'student'
    if (!userId) { wx.showToast({ title: '请先登录', icon: 'none' }); this.likePending = false; return }
    try {
      const res = await post('/api/result/like', { achievementId: this.data.result.id, userId, userType })
      if (res.code === 200) {
        const result = this.data.result
        const isLiked = !result.isLiked
        const newCount = Math.max(0, (result.likeCount || 0) + (isLiked ? 1 : -1))
        this.setData({
          'result.isLiked': isLiked,
          'result.likeCount': newCount
        })
        wx.showToast({ title: isLiked ? '点赞成功' : '已取消', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      this.likePending = false
    }
  },

  // 发表评论
  async submitComment() {
    if (!this.data.commentText.trim()) { wx.showToast({ title: '请输入内容', icon: 'none' }); return }
    const userId = app.getUserId()
    const userType = wx.getStorageSync('userType') || 'student'
    this.setData({ commentLoading: true })
    try {
      const res = await post('/api/result/comment', {
        achievementId: this.data.result.id, userId, userType, content: this.data.commentText
      })
      if (res.code === 200) {
        wx.showToast({ title: '评论成功', icon: 'success' })
        const newComment = {
          id: 'c' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), userType, content: this.data.commentText,
          createTime: new Date().toISOString(),
          _avatarChar: (userType || '?').charAt(0).toUpperCase(),
          _date: this.formatDate(new Date().toISOString())
        }
        const comments = [newComment, ...this.data.comments]
        this.setData({ comments, commentCount: comments.length, commentText: '' })
      }
    } catch (err) { /* ignore */ } finally {
      this.setData({ commentLoading: false })
    }
  },

  // 下载文件
  downloadFile(e) {
    const { url, name } = e.currentTarget.dataset
    if (url) {
      wx.showLoading({ title: '下载中...' })
      wx.downloadFile({
        url,
        success(res) {
          wx.hideLoading()
          wx.openDocument({ filePath: res.tempFilePath, showMenu: true })
        },
        fail() {
          wx.hideLoading()
          wx.showToast({ title: '下载失败', icon: 'none' })
        }
      })
    } else {
      wx.showToast({ title: '文件地址不可用', icon: 'none' })
    }
  },

  switchTab(e) { this.setData({ activeTab: e.currentTarget.dataset.key }) },
  onCommentInput(e) { this.setData({ commentText: e.detail.value }) },
  handleShare() { wx.showToast({ title: '分享功能开发中', icon: 'none' }) },
  formatDate(date) {
    if (!date) return ''
    const d = new Date(date)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  },

  onShareAppMessage() {
    return { title: this.data.result?.title || '成果详情', path: '/pages/detail/detail?id=' + (this.data.result?.id || '') }
  }
})
