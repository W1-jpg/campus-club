<template>
  <PageLayout userType="student">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">我的申请</h1>
          <p class="page-hero__subtitle">管理你的资源对接申请记录</p>
        </div>
      </div>

      <!-- 状态筛选标签 -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button
            v-for="opt in statusOptions"
            :key="opt.value"
            :class="['filter-tab', { active: selectedStatus === opt.value }]"
            @click="selectedStatus = opt.value; loadApplications()"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 申请列表 -->
      <div v-if="applications.length > 0" class="application-list">
        <div class="application-card" v-for="app in applications" :key="app.id">
          <div class="application-card__header">
            <h3>{{ app.resourceTitle }}</h3>
            <el-tag :type="getStatusType(app.status)" size="default" effect="plain">{{ app.status }}</el-tag>
          </div>
          <div class="application-card__info">
            <div class="info-row">
              <span class="info-label">资源类型</span>
              <span class="info-value">{{ app.resourceType || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">提供方</span>
              <span class="info-value">{{ app.resourceProvider || '未知' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">申请时间</span>
              <span class="info-value">{{ formatDate(app.applicationTime) }}</span>
            </div>
          </div>
          <div class="application-card__actions">
            <el-button size="small" @click="viewResourceDetail(app.resourceId)">查看资源详情</el-button>
            <el-button size="small" type="primary" @click="openChat(app)">沟通</el-button>
            <el-button v-if="app.status === '待审核'" size="small" type="danger" plain @click="cancelApplication(app.id)">取消申请</el-button>
          </div>
        </div>
      </div>

      <div v-else class="state-box">
        <div class="state-box__icon">📋</div>
        <p class="state-box__title">暂无申请记录</p>
        <p class="state-box__hint">你还没有提交过资源对接申请</p>
        <el-button type="primary" @click="$router.push('/资源对接')">去浏览资源</el-button>
      </div>
    </div>

    <!-- 资源详情弹窗 -->
    <el-dialog v-model="showResourceDetailDialog" title="资源详情" width="480px" :close-on-click-modal="true">
      <div class="detail-content" v-if="currentResource">
        <div class="detail-row"><span class="detail-label">标题</span><span class="detail-value">{{ currentResource.title }}</span></div>
        <div class="detail-row"><span class="detail-label">类型</span><span class="detail-value">{{ currentResource.type }}</span></div>
        <div class="detail-row"><span class="detail-label">提供方</span><span class="detail-value">{{ currentResource.provider }}</span></div>
        <div class="detail-row"><span class="detail-label">描述</span><span class="detail-value">{{ currentResource.description }}</span></div>
        <div class="detail-row"><span class="detail-label">发布时间</span><span class="detail-value">{{ formatDate(currentResource.publishTime) }}</span></div>
        <div class="detail-row" v-if="currentResource.endTime"><span class="detail-label">截止时间</span><span class="detail-value text-danger">{{ formatDate(currentResource.endTime) }}</span></div>
        <div class="detail-row"><span class="detail-label">状态</span><span class="detail-value">{{ currentResource.status }}</span></div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showResourceDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <ApplicationChat
      v-model:visible="chatVisible"
      :application-id="chatApplication?.id"
      :title="chatApplication?.resourceTitle || ''"
    />
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'
import ApplicationChat from './components/ApplicationChat.vue'

const selectedStatus = ref('')
const applications = ref([])
const showResourceDetailDialog = ref(false)
const currentResource = ref(null)
const chatVisible = ref(false)
const chatApplication = ref(null)

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待审核', value: '待审核' },
  { label: '已通过', value: '已通过' },
  { label: '已拒绝', value: '已拒绝' },
]

const loadApplications = async () => {
  try {
    const studentId = localStorage.getItem('studentId')
    if (!studentId) { ElMessage.error('请先登录'); return }
    const response = await request.get(`/api/resource/applications/student/${studentId}`)
    const applicationList = response.data || []
    const enriched = await Promise.all(applicationList.map(async (app) => {
      try {
        const res = await request.get(`/api/resource/${app.resourceId}`)
        const resource = res.data
        return { ...app, resourceTitle: resource.title, resourceType: resource.type, resourceProvider: resource.provider }
      } catch {
        return { ...app, resourceTitle: '资源已删除', resourceType: '', resourceProvider: '' }
      }
    }))
    if (selectedStatus.value) applications.value = enriched.filter(app => app.status === selectedStatus.value)
    else applications.value = enriched
  } catch (error) { ElMessage.error('加载申请记录失败，请检查网络连接') }
}

const openChat = (app) => { chatApplication.value = app; chatVisible.value = true }
const viewResourceDetail = async (resourceId) => {
  try {
    const response = await request.get(`/api/resource/${resourceId}`)
    currentResource.value = response.data
    showResourceDetailDialog.value = true
  } catch (error) { ElMessage.error('获取资源详情失败') }
}

const cancelApplication = async (applicationId) => {
  try {
    await ElMessageBox.confirm('确定要取消该申请吗？', '取消申请', { confirmButtonText: '确定', cancelButtonText: '返回', type: 'warning' })
    ElMessage.success('申请已取消')
    loadApplications()
  } catch { /* 用户取消 */ }
}

const getStatusType = (status) => ({ '待审核':'warning','已通过':'success','已拒绝':'danger','已取消':'info' }[status] || 'info')

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

onMounted(() => { loadApplications() })
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

/* 页面头部 */
.page-hero {
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xxxl) var(--spacing-xxl);
  margin-bottom: var(--spacing-xl);
  color: var(--text-inverse);
  box-shadow: var(--shadow-lg);
}
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; }

/* 筛选标签栏 */
.filter-bar { margin-bottom: var(--spacing-xl); }
.filter-tabs { display: flex; gap: var(--spacing-sm); }
.filter-tab { padding: 8px 20px; border: 1px solid var(--border-color); border-radius: var(--radius-round); background: var(--bg-card); font-size: var(--font-size-sm); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-base); font-weight: 500; }
.filter-tab:hover { border-color: var(--color-primary-light); color: var(--color-primary); }
.filter-tab.active { background: var(--gradient-primary); color: #fff; border-color: transparent; }

/* 申请卡片 */
.application-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.application-card { background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); padding: var(--spacing-xl); transition: all var(--transition-base); }
.application-card:hover { box-shadow: var(--shadow-md); border-color: var(--color-primary-light); }
.application-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
.application-card__header h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin: 0; flex: 1; line-height: 1.4; }
.application-card__info { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); padding: var(--spacing-lg); background: var(--color-primary-bg-light); border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); margin-bottom: var(--spacing-lg); }
.info-row {  }
.info-label { display: block; font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: 2px; }
.info-value { font-size: var(--font-size-base); color: var(--text-primary); font-weight: 500; }
.application-card__actions { display: flex; gap: var(--spacing-md); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color-light); }

/* 空状态 */
.state-box { text-align: center; padding: 80px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.state-box__icon { font-size: 64px; margin-bottom: var(--spacing-lg); }
.state-box__title { font-size: var(--font-size-xl); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-sm) 0; }
.state-box__hint { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0 0 var(--spacing-xl) 0; }

/* 详情弹窗 */
.detail-content { display: flex; flex-direction: column; gap: var(--spacing-md); }
.detail-row { display: flex; flex-direction: column; gap: 2px; }
.detail-label { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.detail-value { font-size: var(--font-size-base); color: var(--text-primary); line-height: 1.5; }
.text-danger { color: var(--color-danger) !important; }

@media (max-width: 768px) {
  .view-content { padding: var(--spacing-md); }
  .page-hero { padding: var(--spacing-lg); }
  .page-hero__title { font-size: var(--font-size-xl); }
  .application-card__info { grid-template-columns: 1fr; }
  .application-card__header { flex-direction: column; }
  .application-card__actions { flex-direction: column; }
  .application-card__actions .el-button { width: 100%; }
}
</style>
