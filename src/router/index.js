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

// 教师端页面
const TeacherHome = () => import('../views/TeacherHome.vue')
const TeacherNoticeManage = () => import('../views/TeacherNoticeManage.vue')
const AchievementScoring = () => import('../views/AchievementScoring.vue')
const AchievementIncubation = () => import('../views/AchievementIncubation.vue')
const ExpertReview = () => import('../views/ExpertReview.vue')
const ResourceMatching = () => import('../views/ResourceMatching.vue')
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
    // 5. 专家评审
    {
        path: '/expert-review',
        alias: '/专家评审',
        name: 'ExpertReview',
        component: ExpertReview,
        meta: { title: '专家评审', requiresAuth: true, userType: 'teacher' }
    },
    // 6. 资源对接
    {
        path: '/resource-matching',
        alias: '/资源对接',
        name: 'ResourceMatching',
        component: ResourceMatching,
        meta: { title: '资源对接', requiresAuth: true, userType: 'teacher' }
    },
    // 7. 获奖情况管理
    {
        path: '/teacher-award-manage',
        alias: '/获奖情况管理',
        name: 'TeacherAwardManage',
        component: TeacherAwardManage,
        meta: { title: '获奖情况管理', requiresAuth: true, userType: 'teacher' }
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
    // 8. 404页面（兜底）
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

    // 3. 未登录：跳回登录页并记录跳转路径
    if (!token) {
        next(`/login/student?redirect=${to.fullPath}`)
        return
    }

    // 4. 验证用户类型
    if (to.meta.userType && to.meta.userType !== userType) {
        // 根据用户类型跳转到对应的首页
        if (userType === 'teacher') {
            next('/teacher-home')
        } else if (userType === 'admin') {
            next('/admin-home')
        } else {
            next('/student-home')
        }
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