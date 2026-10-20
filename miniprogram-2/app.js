App({
  globalData: {
    userInfo: null,
    token: '',
    userType: '',
    college: ''
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    const userType = wx.getStorageSync('userType')
    const userInfo = wx.getStorageSync('userInfo')
    const college = wx.getStorageSync('college')

    if (token) {
      this.globalData.token = token
      this.globalData.userType = userType
      this.globalData.userInfo = userInfo
      this.globalData.college = college
    }
  },

  checkLogin() {
    const token = wx.getStorageSync('token')
    if (!token) {
      wx.navigateTo({ url: '/pages/login/login' })
      return false
    }
    return true
  },

  getUserId() {
    const userType = this.globalData.userType || wx.getStorageSync('userType')
    const idMap = {
      student: 'studentId',
      teacher: 'teacherId',
      admin: 'adminId',
      expert: 'expertId',
      enterprise: 'enterpriseId'
    }
    return wx.getStorageSync(idMap[userType] || 'studentId') || ''
  }
})
