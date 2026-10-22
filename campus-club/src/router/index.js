import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

// 补充：引入404页面（确保文件存在）
const NotFound = () => import('../views/NotFound.vue')
// 补充：引入学生首页组件（按需加载，优化性能）
const StudentHome = () => import('../views/StudentHome.vue')
// 补充：预留其他功能页面（学生端核心功能）
const ResultMarket = () => import('../views/ResultMarket.vue')
const ResultUpload = () => import('../views/ResultUpload.vue')
const MyIncubate = () => import('../views/MyIncubate.vue')
const MyResult = () => import('../views/MyResult.vue')
const SystemNotify = () => import('../views/SystemNotify.vue')
const ResultDetail = () => import('../views/ResultDetail.vue')
const MyApplications = () => import('../views/MyApplications.vue')
const StudentResourceMatching = () => import('../views/StudentResourceMatching.vue')
const AwardUpload = () => import('../views/AwardUpload.vue')
const ResultBrowse = () => import('../views/ResultBrowse.vue')

// 数据可视化（学生/教师/管理员三端共用，按角色分权展示）
const VisualizationDashboard = () => import('../views/VisualizationDashboard.vue')
const VisualizationScreen = () => import('../views/VisualizationScreen.vue')

// 教师端页面
const TeacherHome = () => import('../views/TeacherHome.vue')
const TeacherNoticeManage = () => import('../views/TeacherNoticeManage.vue')
const AchievementScoring = () => import('../views/AchievementScoring.vue')
const AchievementIncubation = () => import('../views/AchievementIncubation.vue')
const TeacherAwardManage = () => import('../views/TeacherAwardManage.vue')

// 管理员端页面
const AdminHome = () => import('../views/AdminHome.vue')
const AdminStudentManage = () => import('../views/AdminStudentManage.vue')
const AdminTeacherManage = () => import('../views/AdminTeacherManage.vue')
const AdminResultManage = () => import('../views/AdminResultManage.vue')
const AdminNoticeManage = () => import('../views/AdminNoticeManage.vue')
const AdminResourceManage = () => import('../views/AdminResourceManage.vue')
const AdminAwardManage = () => import('../views/AdminAwardManage.vue')
const AdminSystemSetting = () => import('../views/AdminSystemSetting.vue')
const AdminExpertManage = () => import('../views/AdminExpertManage.vue')
const AdminEnterpriseManage = () => import('../views/AdminEnterpriseManage.vue')
const AdminReviewManage = () => import('../views/AdminReviewManage.vue')
const AdminApplicationManage = () => import('../views/AdminApplicationManage.vue')

// 评审专家端页面
const ExpertHome = () => import('../views/ExpertHome.vue')
const ExpertAchievementReview = () => import('../views/ExpertAchievementReview.vue')
const ExpertNotifications = () => import('../views/ExpertNotifications.vue')
const ExpertReviewHistory = () => import('../views/ExpertReviewHistory.vue')
// 企业合作端页面
const EnterpriseHome = () => import('../views/EnterpriseHome.vue')
const EnterpriseResources = () => import('../views/EnterpriseResources.vue')
const EnterpriseApplications = () => import('../views/EnterpriseApplications.vue')
const EnterpriseAchievements = () => import('../views/EnterpriseAchievements.vue')
const EnterpriseWallet = () => import('../views/EnterpriseWallet.vue')

const routes = [
    { path: '/', redirect: '/login/student' },
    // 登录/注册路由（保留原有）
    {
        path: '/login/:userType',
        component: Login,
        props: true,
        meta: { title: '登录', requiresAuth: false }
    },
    {
        path: '/register/:userType',
        component: Register,
        props: true,
        meta: { title: '注册', requiresAuth: false }
    },
    // ==================== 学生端核心路由（英文路径+中文别名） ====================
    // 1. 学生端首页
    {
        path: '/student-home',
        alias: '/学生首页', // 新增：中文别名，兼容中文访问
        name: 'StudentHome',
        component: StudentHome,
        meta: {
            title: '学生首页',
            requiresAuth: true,
            userType: 'student'
        },
        beforeEnter: (to, from, next) => {
            const token = localStorage.getItem('token')
            const userType = localStorage.getItem('userType')
            if (token && userType === 'student') {
                next()
            } else {
                next('/login/student')
            }
        }
    },
    // 2. 成果市场（英文路径+中文别名）
    {
        path: '/result-market',
        alias: '/成果市场', // 兼容中文访问
        name: 'ResultMarket',
        component: ResultMarket,
        meta: { title: '成果市场', requiresAuth: true, userType: 'student' }
    },
    // 3. 成果上传（核心：解决中文访问404）
    {
        path: '/result-upload',
        alias: '/成果上传', // 新增中文别名，访问/成果上传也能匹配
        name: 'ResultUpload',
        component: ResultUpload,
        meta: { title: '成果上传', requiresAuth: true, userType: 'student' }
    },
    // 4. 我的孵化
    {
        path: '/my-incubate',
        alias: '/我的孵化',
        name: 'MyIncubate',
        component: MyIncubate,
        meta: { title: '我的孵化', requiresAuth: true, userType: 'student' }
    },
    // 5. 我的成果
    {
        path: '/my-result',
        alias: '/我的成果',
        name: 'MyResult',
        component: MyResult,
        meta: { title: '我的成果', requiresAuth: true, userType: 'student' }
    },
    // 6. 系统通知
    {
        path: '/system-notify',
        alias: '/系统通知',
        name: 'SystemNotify',
        component: SystemNotify,
        meta: { title: '系统通知', requiresAuth: true, userType: 'student' }
    },
    // 7. 我的申请
    {
        path: '/my-applications',
        alias: '/我的申请',
        name: 'MyApplications',
        component: MyApplications,
        meta: { title: '我的申请', requiresAuth: true, userType: 'student' }
    },
    // 8. 资源对接（学生端）
    {
        path: '/student-resource-matching',
        alias: '/资源对接',
        name: 'StudentResourceMatching',
        component: StudentResourceMatching,
        meta: { title: '资源对接', requiresAuth: true, userType: 'student' }
    },
    // 9. 成果浏览
    {
        path: '/result-browse',
        alias: '/成果浏览',
        name: 'ResultBrowse',
        component: ResultBrowse,
        meta: { title: '成果浏览', requiresAuth: true, userType: 'student' }
    },
    // 9. 获奖上传
    {
        path: '/award-upload',
        alias: '/获奖上传',
        name: 'AwardUpload',
        component: AwardUpload,
        meta: { title: '获奖上传', requiresAuth: true, userType: 'student' }
    },

    // 7. 成果详情（参数路由）
    {
        path: '/result-detail/:id',
        alias: '/成果详情/:id',
        name: 'ResultDetail',
        component: ResultDetail,
        meta: { title: '成果详情', requiresAuth: true, userType: 'student' },
        props: true
    },
    // ==================== 教师端核心路由 ====================
    // 1. 教师端首页
    {
        path: '/teacher-home',
        alias: '/教师首页',
        name: 'TeacherHome',
        component: TeacherHome,
        meta: {
            title: '教师首页',
            requiresAuth: true,
            userType: 'teacher'
        },
        beforeEnter: (to, from, next) => {
            const token = localStorage.getItem('token')
            const userType = localStorage.getItem('userType')
            if (token && userType === 'teacher') {
                next()
            } else {
                next('/login/teacher')
            }
        }
    },
    // 2. 系统通知管理
    {
        path: '/teacher-notice-manage',
        alias: '/系统通知管理',
        name: 'TeacherNoticeManage',
        component: TeacherNoticeManage,
        meta: { title: '系统通知管理', requiresAuth: true, userType: 'teacher' }
    },

    // 3. 成果评分
    {
        path: '/achievement-scoring',
        alias: '/成果评分',
        name: 'AchievementScoring',
        component: AchievementScoring,
        meta: { title: '成果评分', requiresAuth: true, userType: 'teacher' }
    },
    // 4. 成果孵化
    {
        path: '/achievement-incubation',
        alias: '/成果孵化',
        name: 'AchievementIncubation',
        component: AchievementIncubation,
        meta: { title: '成果孵化', requiresAuth: true, userType: 'teacher' }
    },
    // 7. 获奖情况管理
    {
        path: '/teacher-award-manage',
        alias: '/获奖情况管理',
        name: 'TeacherAwardManage',
        component: TeacherAwardManage,
        meta: { title: '获奖情况管理', requiresAuth: true, userType: 'teacher' }
    },
    // 8. 成果浏览
    {
        path: '/teacher-result-browse',
        alias: '/教师成果浏览',
        name: 'TeacherResultBrowse',
        component: ResultBrowse,
        meta: { title: '成果浏览', requiresAuth: true, userType: 'teacher' }
    },
    // ==================== 管理员端核心路由 ====================
    // 1. 管理员端首页
    {
        path: '/admin-home',
        alias: '/管理员首页',
        name: 'AdminHome',
        component: AdminHome,
        meta: {
            title: '管理员首页',
            requiresAuth: true,
            userType: 'admin'
        },
        beforeEnter: (to, from, next) => {
            const token = localStorage.getItem('token')
            const userType = localStorage.getItem('userType')
            if (token && userType === 'admin') {
                next()
            } else {
                next('/login/admin')
            }
        }
    },
    // 2. 学生管理
    {
        path: '/admin-student-manage',
        alias: '/学生管理',
        name: 'AdminStudentManage',
        component: AdminStudentManage,
        meta: { title: '学生管理', requiresAuth: true, userType: 'admin' }
    },
    // 3. 教师管理
    {
        path: '/admin-teacher-manage',
        alias: '/教师管理',
        name: 'AdminTeacherManage',
        component: AdminTeacherManage,
        meta: { title: '教师管理', requiresAuth: true, userType: 'admin' }
    },

    // 5. 成果管理
    {
        path: '/admin-result-manage',
        alias: '/成果管理',
        name: 'AdminResultManage',
        component: AdminResultManage,
        meta: { title: '成果管理', requiresAuth: true, userType: 'admin' }
    },
    // 6. 通知管理
    {
        path: '/admin-notice-manage',
        alias: '/通知管理',
        name: 'AdminNoticeManage',
        component: AdminNoticeManage,
        meta: { title: '通知管理', requiresAuth: true, userType: 'admin' }
    },
    // 7. 资源管理
    {
        path: '/admin-resource-manage',
        alias: '/资源管理',
        name: 'AdminResourceManage',
        component: AdminResourceManage,
        meta: { title: '资源管理', requiresAuth: true, userType: 'admin' }
    },
    // 8. 获奖管理
    {
        path: '/admin-award-manage',
        alias: '/获奖管理',
        name: 'AdminAwardManage',
        component: AdminAwardManage,
        meta: { title: '获奖管理', requiresAuth: true, userType: 'admin' }
    },
    // 9. 系统设置
    {
        path: '/admin-system-setting',
        alias: '/系统设置',
        name: 'AdminSystemSetting',
        component: AdminSystemSetting,
        meta: { title: '系统设置', requiresAuth: true, userType: 'admin' }
    },
    // 10. 专家管理
    { path: '/admin-expert-manage', alias: '/专家管理', name: 'AdminExpertManage', component: AdminExpertManage, meta: { title: '专家管理', requiresAuth: true, userType: 'admin' } },
    // 11. 企业管理
    { path: '/admin-enterprise-manage', alias: '/企业管理', name: 'AdminEnterpriseManage', component: AdminEnterpriseManage, meta: { title: '企业管理', requiresAuth: true, userType: 'admin' } },
    // 12. 评审记录管理
    { path: '/admin-review-manage', alias: '/评审记录', name: 'AdminReviewManage', component: AdminReviewManage, meta: { title: '评审记录', requiresAuth: true, userType: 'admin' } },
    // 13. 申请管理
    { path: '/admin-application-manage', alias: '/申请管理', name: 'AdminApplicationManage', component: AdminApplicationManage, meta: { title: '申请管理', requiresAuth: true, userType: 'admin' } },
    // ==================== 评审专家端核心路由 ====================
    {
        path: '/expert-home', alias: '/专家首页', name: 'ExpertHome',
        component: ExpertHome, meta: { title: '专家首页', requiresAuth: true, userType: 'expert' },
        beforeEnter: (to, from, next) => { const t = localStorage.getItem('token'); const u = localStorage.getItem('userType'); if (t && u === 'expert') next(); else next('/login/expert'); }
    },
    { path: '/expert-achievement-review', alias: '/成果评审', name: 'ExpertAchievementReview', component: ExpertAchievementReview, meta: { title: '成果评审', requiresAuth: true, userType: 'expert' } },
    { path: '/expert-notifications', alias: '/通知提醒', name: 'ExpertNotifications', component: ExpertNotifications, meta: { title: '通知提醒', requiresAuth: true, userType: 'expert' } },
    { path: '/expert-review-history', alias: '/评审历史', name: 'ExpertReviewHistory', component: ExpertReviewHistory, meta: { title: '评审历史', requiresAuth: true, userType: 'expert' } },
    // ==================== 企业合作端核心路由 ====================
    {
        path: '/enterprise-home', alias: '/企业首页', name: 'EnterpriseHome',
        component: EnterpriseHome, meta: { title: '企业首页', requiresAuth: true, userType: 'enterprise' },
        beforeEnter: (to, from, next) => { const t = localStorage.getItem('token'); const u = localStorage.getItem('userType'); if (t && u === 'enterprise') next(); else next('/login/enterprise'); }
    },
    { path: '/enterprise-resources', alias: '/企业投递资源', name: 'EnterpriseResources', component: EnterpriseResources, meta: { title: '资源投递', requiresAuth: true, userType: 'enterprise' } },
    { path: '/enterprise-applications', alias: '/企业审批申请', name: 'EnterpriseApplications', component: EnterpriseApplications, meta: { title: '申请审批', requiresAuth: true, userType: 'enterprise' } },
    { path: '/enterprise-achievements', alias: '/企业浏览成果', name: 'EnterpriseAchievements', component: EnterpriseAchievements, meta: { title: '浏览成果', requiresAuth: true, userType: 'enterprise' } },
    { path: '/enterprise-wallet', alias: '/企业钱包', name: 'EnterpriseWallet', component: EnterpriseWallet, meta: { title: '钱包充值', requiresAuth: true, userType: 'enterprise' } },

    // ==================== 数据可视化（学生/教师/管理员共用） ====================
    {
        path: '/visualization',
        alias: '/数据可视化',
        name: 'Visualization',
        component: VisualizationDashboard,
        meta: { title: '数据可视化', requiresAuth: true, userTypes: ['student', 'teacher', 'admin'] }
    },
    {
        path: '/visualization-screen',
        alias: '/数据大屏',
        name: 'VisualizationScreen',
        component: VisualizationScreen,
        meta: { title: '数据大屏', requiresAuth: true, userTypes: ['student', 'teacher', 'admin'] }
    },

    // 404页面（兜底）
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound,
        meta: { title: '页面不存在', requiresAuth: false }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// ==================== 全局路由守卫（完善） ====================
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')

    // 1. 动态设置页面标题
    document.title = to.meta.title
        ? `${to.meta.title} - 校园社团成果展示与孵化系统`
        : '校园社团成果展示与孵化系统'

    // 2. 放行无需登录的页面
    if (!to.meta.requiresAuth) {
        next()
        return
    }

    // 3. 未登录：跳回对应角色登录页
    if (!token) {
        const loginRole = to.meta.userType || 'student'
        next(`/login/${loginRole}?redirect=${to.fullPath}`)
        return
    }

    // 4. 验证用户类型
    if (to.meta.userType && to.meta.userType !== userType) {
        const homeMap = { teacher: '/teacher-home', admin: '/admin-home', expert: '/expert-home', enterprise: '/enterprise-home' }
        next(homeMap[userType] || '/student-home')
        return
    }

    // 4.1 多角色页面（如数据可视化）：仅允许列表内的角色访问
    if (to.meta.userTypes && !to.meta.userTypes.includes(userType)) {
        const homeMap = { teacher: '/teacher-home', admin: '/admin-home', expert: '/expert-home', enterprise: '/enterprise-home' }
        next(homeMap[userType] || '/student-home')
        return
    }

    // 5. 正常放行
    next()
})

// ==================== 路由错误处理 ====================
router.onError((error) => {
    const pattern = /Loading chunk (\d)+ failed/g
    if (error.message.match(pattern)) {
        window.location.reload() // 懒加载失败时刷新
    }
})

export default router