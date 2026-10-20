// src/api/auth.js
import request from '../utils/request'

// 登录接口（保留你之前的核心登录逻辑）
export const login = (userType, loginData) => {
    let url = `/api/auth/login/${userType}`
    return request({
        url: url,
        method: 'POST',
        data: loginData
    })
}

// ==================== 核心修复：添加 register 函数 ====================
export const register = (userType, registerData) => {
    return request({
        url: `/api/auth/register/${userType}`, // 对应后端 /api/auth/register/student
        method: 'POST',
        data: registerData
    })
}

// 保留原有接口（可选）
export const loginStudent = (data) => { /* ... */ }
export const loginTeacher = (data) => { /* ... */ }
export const loginAdmin = (data) => { /* ... */ }