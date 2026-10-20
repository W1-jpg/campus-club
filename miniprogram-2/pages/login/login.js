const { post } = require('../../utils/request')
const app = getApp()

Page({
  data: {
    userType: 'student',
    roleList: [
      { code: 'student', name: '学生' },
      { code: 'teacher', name: '教师' },
      { code: 'expert', name: '专家' },
      { code: 'enterprise', name: '企业' }
    ],
    // 微信登录
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    nickName: '',
    loading: false,
    // 账号密码
    showPwdLogin: false,
    showPwd: false,
    username: '',
    password: '',
    rememberPwd: false,
    pwdLoading: false,
    // 注册
    showRegister: false,
    regUsername: '',
    regPassword: '',
    regRealName: '',
    regId: '',
    regCollege: '',
    regLoading: false
  },

  onLoad() {
    // 已登录则直接跳转
    const token = wx.getStorageSync('token')
    if (token) {
      const userType = wx.getStorageSync('userType') || 'student'
      this.goHome(userType)
    }
  },

  // 切换角色
  switchRole(e) {
    this.setData({ userType: e.currentTarget.dataset.type })
  },

  // 选择头像
  onChooseAvatar(e) {
    this.setData({ avatarUrl: e.detail.avatarUrl })
  },

  // 输入昵称
  onNickInput(e) {
    this.setData({ nickName: e.detail.value })
  },

  // 微信一键登录
  async handleWxLogin() {
    if (!this.data.nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      // 1. wx.login 获取 code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject })
      })
      const code = loginRes.code

      // 2. 发送到后端换取 token
      const res = await post('/api/auth/wx-login', {
        code,
        nickName: this.data.nickName,
        avatarUrl: this.data.avatarUrl,
        userType: this.data.userType
      })

      // 3. 存储登录态
      this.saveLogin(res.data)
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => this.goHome(this.data.userType), 800)
    } catch (err) {
      console.error('登录失败:', err)
      // 根据错误类型给出不同提示
      if (err.msg && err.msg.includes('用户不存在')) {
        wx.showToast({ title: '首次使用，请先注册', icon: 'none' })
        this.setData({ showRegister: true })
      } else if (err.errMsg && err.errMsg.includes('login:fail')) {
        wx.showToast({ title: '微信授权失败，请重试', icon: 'none' })
      } else {
        // 网络错误或后端未启动 — request.js 已弹 toast，此处不再重复
      }
    } finally {
      this.setData({ loading: false })
    }
  },

  // 账号密码登录
  async handlePwdLogin() {
    if (!this.data.username || !this.data.password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    this.setData({ pwdLoading: true })
    try {
      const res = await post('/api/auth/login/' + this.data.userType, {
        username: this.data.username,
        password: this.data.password
      })
      this.saveLogin(res.data)
      if (this.data.rememberPwd) {
        wx.setStorageSync('rememberedUser', this.data.username)
        wx.setStorageSync('rememberedType', this.data.userType)
      }
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => this.goHome(this.data.userType), 800)
    } catch (err) {
      wx.showToast({ title: err.msg || '登录失败', icon: 'none' })
    } finally {
      this.setData({ pwdLoading: false })
    }
  },

  // 注册
  async handleRegister() {
    const { regUsername, regPassword, regRealName, regCollege, userType } = this.data
    if (!regUsername || !regPassword || !regRealName) {
      wx.showToast({ title: '请填写必要信息', icon: 'none' })
      return
    }
    this.setData({ regLoading: true })
    try {
      const res = await post('/api/auth/register/' + userType, {
        username: regUsername,
        password: regPassword,
        realName: regRealName,
        college: regCollege,
        studentId: this.data.regId
      })
      wx.showToast({ title: '注册成功', icon: 'success' })
      this.setData({ showRegister: false })
    } catch (err) {
      wx.showToast({ title: err.msg || '注册失败', icon: 'none' })
    } finally {
      this.setData({ regLoading: false })
    }
  },

  // 存储登录态
  saveLogin(rawData) {
    // 后端 login 接口返回的 data 是 JSON 字符串，需要 parse
    let data = rawData
    if (typeof data === 'string') {
      try { data = JSON.parse(data) } catch (e) { data = {} }
    }
    if (!data || typeof data !== 'object') data = {}

    const token = data.token || ''
    const user = data.user || data
    const userId = data.studentId || data.teacherId || data.adminId || data.expertId || data.enterpriseId || user.id || ''

    wx.setStorageSync('token', token)
    wx.setStorageSync('userType', this.data.userType)
    wx.setStorageSync('userInfo', user)
    wx.setStorageSync('username', user.username || user.realName || this.data.nickName)
    wx.setStorageSync('college', user.college || data.college || '')
    // 按角色存 ID
    const idKey = this.data.userType + 'Id'
    wx.setStorageSync(idKey, userId)
    // 更新全局
    app.globalData.token = token
    app.globalData.userType = this.data.userType
    app.globalData.userInfo = user
    app.globalData.college = data.college || user.college || ''
  },

  // 跳转首页
  goHome(type) {
    const homeMap = {
      student: '/pages/index/index',
      teacher: '/pages/index/index',
      expert: '/pages/index/index',
      enterprise: '/pages/resource/resource',
      admin: '/pages/index/index'
    }
    wx.switchTab({ url: homeMap[type] || '/pages/index/index' })
  },

  togglePwdLogin() {
    this.setData({ showPwdLogin: !this.data.showPwdLogin, showRegister: false })
  },
  toggleRemember() {
    this.setData({ rememberPwd: !this.data.rememberPwd })
  },
  switchToRegister() {
    this.setData({ showRegister: !this.data.showRegister, showPwdLogin: false })
  },
  onUsernameInput(e) { this.setData({ username: e.detail.value }) },
  onPwdInput(e) { this.setData({ password: e.detail.value }) },
  onRegInput(e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [field]: e.detail.value })
  }
})
