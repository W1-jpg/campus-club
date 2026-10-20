const app = getApp()

Page({
  data: {
    userInfo: {},
    roleText: '学生',
    avatarChar: '?',
    menuList: [
      { icon: '📋', label: '我的成果', path: '/pages/my-results/my-results' },
      { icon: '🚀', label: '我的孵化', path: '/pages/my-incubation/my-incubation' },
      { icon: '📝', label: '我的申请', path: '/pages/my-applications/my-applications' },
      { icon: '📤', label: '成果上传', path: '/pages/upload/upload' },
      { icon: '🏆', label: '获奖上传', path: '/pages/award/award' },
      { icon: '🔔', label: '系统通知', path: '/pages/notification/notification' }
    ]
  },

  onShow() {
    const userType = wx.getStorageSync('userType') || 'student'
    const userInfo = wx.getStorageSync('userInfo') || {}
    const nickname = wx.getStorageSync('username') || ''
    const college = wx.getStorageSync('college') || ''
    const roleMap = { student: '学生', teacher: '教师', admin: '管理员', expert: '评审专家', enterprise: '企业用户' }

    const name = nickname || userInfo.username || '?'
    const avatarChar = (name.charAt(0) || '?').toUpperCase()

    this.setData({
      userInfo: { ...userInfo, nickName: nickname, college },
      roleText: roleMap[userType] || '用户',
      avatarChar
    })
  },

  navigate(e) {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    const url = e.currentTarget.dataset.path
    // tabBar 页面必须用 switchTab
    const tabPages = ['/pages/index/index', '/pages/resource/resource', '/pages/notification/notification', '/pages/mine/mine']
    if (tabPages.includes(url)) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync()
          app.globalData.token = ''
          app.globalData.userInfo = null
          wx.reLaunch({ url: '/pages/login/login' })
        }
      }
    })
  },

  goAbout() {
    wx.showModal({
      title: '关于平台',
      content: '校园社团成果展示与孵化系统\n版本: 1.0.0\n技术栈: Spring Boot + Vue 3 + 微信小程序',
      showCancel: false
    })
  }
})
