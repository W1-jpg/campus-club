const { BASE_URL } = require('./constants')

/**
 * 封装 wx.request，统一处理 token、错误、loading
 */
const request = (options) => {
  const token = wx.getStorageSync('token')
  const silent = options.silent === true  // 静默模式，不弹 toast

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': options.contentType || 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      timeout: 15000,
      success(res) {
        if (res.statusCode === 200) {
          const data = res.data
          if (data.code !== undefined && data.code !== null && data.code !== 200) {
            if (!silent) wx.showToast({ title: data.msg || '请求失败', icon: 'none', duration: 2000 })
            reject(data)
          } else {
            resolve(data)
          }
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          if (!silent) wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
          setTimeout(() => { wx.reLaunch({ url: '/pages/login/login' }) }, 1500)
          reject(res)
        } else {
          if (!silent) wx.showToast({ title: '服务器错误(' + res.statusCode + ')', icon: 'none' })
          reject(res)
        }
      },
      fail(err) {
        const msg = err.errMsg || ''
        if (msg.includes('timeout')) {
          if (!silent) wx.showToast({ title: '请求超时，请重试', icon: 'none', duration: 3000 })
        } else if (msg.includes('fail')) {
          if (!silent) wx.showToast({ title: '网络连接失败，请检查网络', icon: 'none', duration: 3000 })
        } else {
          if (!silent) wx.showToast({ title: '请求失败，请稍后重试', icon: 'none', duration: 3000 })
        }
        reject(err)
      }
    })
  })
}

const get = (url, data, opts) => request({ url, data, ...(opts || {}) })
const post = (url, data, opts) => request({ url, method: 'POST', data, ...(opts || {}) })
const put = (url, data, opts) => request({ url, method: 'PUT', data, ...(opts || {}) })
const del = (url, data, opts) => request({ url, method: 'DELETE', data, ...(opts || {}) })

/**
 * 文件上传封装
 */
const uploadFile = (url, filePath, formData = {}, name = 'file') => {
  const token = wx.getStorageSync('token')
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE_URL + url,
      filePath,
      name,
      formData,
      header: {
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      },
      success(res) {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 200) resolve(data)
          else {
            wx.showToast({ title: data.msg || '上传失败', icon: 'none' })
            reject(data)
          }
        } catch {
          reject({ msg: '解析响应失败' })
        }
      },
      fail(err) {
        wx.showToast({ title: '上传失败，请重试', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = { request, get, post, put, del, uploadFile }
