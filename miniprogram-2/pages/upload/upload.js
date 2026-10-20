const { uploadFile } = require('../../utils/request')
const { ACHIEVEMENT_TYPES } = require('../../utils/constants')
const app = getApp()

Page({
  data: {
    typeOptions: ACHIEVEMENT_TYPES,
    form: { title: '', type: '', community: '', description: '' },
    images: [],
    files: [],
    submitting: false
  },

  onFieldInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ ['form.' + field]: e.detail.value })
  },
  onTypeChange(e) {
    this.setData({ 'form.type': ACHIEVEMENT_TYPES[e.detail.value] })
  },

  chooseImage() {
    wx.chooseImage({
      count: 6 - this.data.images.length,
      sizeType: ['compressed'],
      success: (res) => {
        this.setData({ images: [...this.data.images, ...res.tempFilePaths] })
      }
    })
  },
  removeImage(e) {
    const idx = e.currentTarget.dataset.index
    const images = [...this.data.images]
    images.splice(idx, 1)
    this.setData({ images })
  },

  chooseFile() {
    wx.chooseMessageFile({
      count: 3,
      type: 'file',
      success: (res) => {
        const newFiles = res.tempFiles.map(f => ({ name: f.name, path: f.path }))
        this.setData({ files: [...this.data.files, ...newFiles] })
      }
    })
  },
  removeFile(e) {
    const idx = e.currentTarget.dataset.index
    const files = [...this.data.files]
    files.splice(idx, 1)
    this.setData({ files })
  },

  async submitForm() {
    const { form, images, files } = this.data

    if (!form.title || !form.type || !form.description) {
      wx.showToast({ title: '请填写必填项', icon: 'none' }); return
    }

    // 拿到第一个有效文件路径（图片或文档），其余暂存提示
    let firstPath = null
    if (files.length > 0 && files[0].path) firstPath = files[0].path
    else if (images.length > 0 && images[0]) firstPath = images[0]

    if (!firstPath) {
      wx.showToast({ title: '请至少上传一个文件或图片', icon: 'none' }); return
    }

    // ⚠ studentId 必须是数字
    const rawId = app.getUserId()
    const studentId = parseInt(rawId, 10)
    if (!studentId || studentId <= 0) {
      wx.showToast({ title: '请先登录', icon: 'none' }); return
    }

    const college = wx.getStorageSync('college') || ''

    this.setData({ submitting: true })

    try {
      const res = await uploadFile('/api/result/upload', firstPath, {
        title: form.title,
        type: form.type,
        description: form.description,
        studentId: String(studentId),
        college
      })

      // 提示用户多文件暂时只传了第一个（后端目前单文件上传）
      const totalExtra = (images.length > 0 ? images.length - (firstPath === images[0] ? 1 : 0) : 0)
        + (files.length > 0 ? files.length - (firstPath === files[0].path ? 1 : 0) : 0)
      const msg = totalExtra > 0
        ? '上传成功（多文件暂仅支持首个，其余请编辑追加）'
        : '上传成功'

      wx.showToast({ title: msg, icon: 'success', duration: 2500 })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (err) {
      wx.showToast({ title: err.msg || '上传失败', icon: 'none' })
    } finally {
      this.setData({ submitting: false })
    }
  },

  resetForm() {
    this.setData({
      form: { title: '', type: '', community: '', description: '' },
      images: [],
      files: []
    })
  }
})
