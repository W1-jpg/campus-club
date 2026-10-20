import request from '../utils/request'

// 获取可视化总览数据（真实聚合）
// params: { userType, userId }
export const getVisualizationDashboard = (params) =>
  request({
    url: '/api/visualization/dashboard',
    method: 'get',
    params
  })
