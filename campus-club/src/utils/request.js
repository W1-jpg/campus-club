import axios from 'axios'

// 创建axios实例，通过Vite代理对接后端API
const request = axios.create({
    baseURL: '/',
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json;charset=utf-8'
    }
})

// 请求拦截器：添加JWT令牌，实现权限验证
request.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        // 注销账号接口不需要认证
        if (token && !config.url.includes('/api/auth/delete')) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// 响应拦截器：统一处理返回结果，简化前端调用
request.interceptors.response.use(
    (response) => {
        const data = response.data
        // 检查后端返回的 code 字段，如果不是 200，视为错误
        if (data.code && data.code !== 200) {
            return Promise.reject({ msg: data.msg || '请求失败' })
        }
        return data
    },
    (error) => {
        console.error('接口请求错误：', error)
        // 登录状态失效：清除本地身份并回到对应角色登录页
        if (error.response && error.response.status === 401) {
            const role = localStorage.getItem('userType') || 'student'
            localStorage.removeItem('token')
            localStorage.removeItem('username')
            localStorage.removeItem('userType')
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = `/login/${role}`
            }
            return Promise.reject({ msg: '登录已过期，请重新登录', status: 401 })
        }
        if (error.response && error.response.data) {
            const errorMsg = error.response.data.msg || error.response.data.message || '请求失败'
            return Promise.reject({ msg: errorMsg, status: error.response.status })
        }
        return Promise.reject({ msg: '网络错误，请检查网络连接' })
    }
)

export default request