// 导航配置 — 集中管理三种角色的菜单
export const navConfig = {
  student: [
    { label: '首页', path: '/student-home', icon: 'HomeFilled' },
    { label: '成果市场', path: '/成果市场', icon: 'Shop' },
    { label: '成果上传', path: '/成果上传', icon: 'Upload' },
    { label: '我的孵化', path: '/我的孵化', icon: 'TrendCharts' },
    { label: '我的成果', path: '/我的成果', icon: 'Document' },
    { label: '资源对接', path: '/资源对接', icon: 'Connection' },
    { label: '我的申请', path: '/我的申请', icon: 'List' },
    { label: '获奖上传', path: '/获奖上传', icon: 'Trophy' },
  ],
  teacher: [
    { label: '首页', path: '/teacher-home', icon: 'HomeFilled' },
    { label: '系统通知', path: '/系统通知管理', icon: 'Bell' },
    { label: '成果评分', path: '/成果评分', icon: 'EditPen' },
    { label: '成果孵化', path: '/成果孵化', icon: 'TrendCharts' },
    { label: '专家评审', path: '/专家评审', icon: 'Checked' },
    { label: '资源对接', path: '/资源对接', icon: 'Connection' },
    { label: '获奖情况', path: '/获奖情况管理', icon: 'Trophy' },
  ],
  admin: [
    { label: '首页', path: '/admin-home', icon: 'HomeFilled' },
    { label: '学生管理', path: '/admin-student-manage', icon: 'User' },
    { label: '教师管理', path: '/admin-teacher-manage', icon: 'UserFilled' },
    { label: '成果管理', path: '/admin-result-manage', icon: 'Document' },
    { label: '通知管理', path: '/admin-notice-manage', icon: 'Bell' },
    { label: '资源管理', path: '/admin-resource-manage', icon: 'Box' },
    { label: '获奖管理', path: '/admin-award-manage', icon: 'Trophy' },
    { label: '系统设置', path: '/admin-system-setting', icon: 'Setting' },
  ]
}
