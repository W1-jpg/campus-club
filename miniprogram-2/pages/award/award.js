const { uploadFile, post } = require('../../utils/request')
const { AWARD_LEVELS } = require('../../utils/constants')
const app = getApp()

Page({
  data: {
    levelOptions: AWARD_LEVELS,
    form: { title: '', level: '', awardTime: '', description: '', _levelEmoji: '' },
    images: [],
    submitting: false
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },
  onLevelChange(e) {
    const item = AWARD_LEVELS[e.detail.value]
    this.setData({ 'form.level': item.value, 'form._levelEmoji': item.emoji })
  },
  onDateChange(e) { this.setData({ 'form.awardTime': e.detail.value }) },

  chooseImage() {
    wx.chooseImage({
      count: 9 - this.data.images.length,
      sizeType: ['compressed'],
      success: (res) => { this.setData({ images: [...this.data.images, ...res.tempFilePaths] }) }
    })
  },
  removeImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(idx, 1)
    this.setData({ images })
  },

  async submitForm() {
    const { form, images } = this.data
    if (!form.title || !form.level || !form.awardTime) {
      wx.showToast({ title: '请填写必填项', icon: 'none' }); return
    }
    const studentId = app.getUserId()
    const college = wx.getStorageSync('college') || ''
    if (!studentId) { wx.showToast({ title: '请先登录', icon: 'none' }); return }

    this.setData({ submitting: true })
    try {
      let awardId = null
      if (images.length > 0) {
        // 第一张图片创建获奖记录
        const res = await uploadFile('/api/award/upload', images[0], {
          title: form.title, level: form.level, awardTime: form.awardTime,
          description: form.description, studentId, college
        })
        awardId = res.data?.id || res.data?.awardId
        // 剩余图片逐个追加
        for (let i = 1; i < images.length; i++) {
          try {
            await uploadFile('/api/award/upload-file', images[i], {
              awardId: awardId || '', studentId
            })
          } catch (e) { console.error('追加证书图片失败:', i, e) }
        }
      } else {
        // 无图片时用普通 POST
        await post('/api/award/upload', {
          title: form.title, level: form.level, awardTime: form.awardTime,
          description: form.description, studentId, college
        })
      }
      wx.showToast({ title: '上传成功', icon: 'success' })
      // 先清空表单再恢复按钮（避免重复提交窗口）
      this.setData({ form: { title: '', level: '', awardTime: '', description: '', _levelEmoji: '' }, images: [] })
    } catch (err) {
      wx.showToast({ title: err.msg || '上传失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  }
})
