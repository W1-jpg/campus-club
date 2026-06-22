<template>
  <PageLayout userType="student">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">资源对接</h1>
          <p class="page-hero__subtitle">发现优质资源，助力成果孵化与项目成长</p>
        </div>
      </div>

      <!-- 类型筛选 -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button
            v-for="opt in typeOptions"
            :key="opt.value"
            :class="['filter-tab', { active: filterType === opt.value }]"
            @click="filterType = filterType === opt.value ? '' : opt.value; loadResources()"
          >
            <span class="filter-tab__icon">{{ opt.icon }}</span>
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </div>

      <!-- 资源列表 -->
      <div v-if="resourceList.length > 0" class="resource-grid">
        <div class="resource-card" v-for="item in resourceList" :key="item.id">
          <div class="resource-card__header">
            <div class="resource-card__type-badge" :class="'badge--' + getTypeKey(item.type)">
              <span>{{ getTypeIcon(item.type) }}</span>
            </div>
            <div class="resource-card__header-info">
              <h3>{{ item.title }}</h3>
              <span class="resource-card__type-text">{{ item.type }}</span>
            </div>
            <span class="status-dot" :class="item.status === '进行中' ? 'dot--active' : 'dot--expired'">
              {{ item.status || '未知' }}
            </span>
          </div>

          <div class="resource-card__body">
            <div class="info-row"><span class="label">提供方</span><span class="value">{{ item.provider }}</span></div>
            <div class="info-row"><span class="label">发布时间</span><span class="value">{{ formatTime(item.publishTime) }}</span></div>
            <div class="info-row" v-if="item.endTime"><span class="label">截止时间</span><span class="value text-danger">{{ formatTime(item.endTime) }}</span></div>
            <p class="resource-card__desc" v-if="item.description">{{ item.description }}</p>
            <div class="resource-card__stats">
              <span>👁️ {{ item.viewCount || 0 }} 浏览</span>
              <span>📝 {{ item.applyCount || 0 }} 申请</span>
            </div>
          </div>

          <div class="resource-card__footer">
            <button class="btn-apply" :disabled="item.status !== '进行中'" @click="applyResource(item)">
              {{ item.status === '进行中' ? '📨 立即申请' : '已截止' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="state-box">
        <div class="state-box__icon">📦</div>
        <p class="state-box__title">暂无可用资源</p>
        <p class="state-box__hint">当前没有符合条件的对接资源</p>
      </div>
    </div>

    <!-- 申请弹窗 -->
    <el-dialog v-model="showApplyDialog" title="申请资源" width="480px" :close-on-click-modal="true">
      <div class="apply-form">
        <div class="apply-form__item">
          <label>资源名称</label>
          <el-input v-model="applyForm.resourceTitle" disabled />
        </div>
        <div class="apply-form__item">
          <label>申请人</label>
          <el-input v-model="applyForm.studentName" disabled />
        </div>
        <div class="apply-form__item">
          <label>所在学院</label>
          <el-input v-model="applyForm.studentCollege" disabled />
        </div>
        <div class="apply-form__item">
          <label>申请理由（可选）</label>
          <el-input type="textarea" v-model="applyForm.reason" :rows="4" placeholder="请输入申请理由，以便提供方更好地了解你的需求" />
        </div>
      </div>
      <template #footer>
        <el-button @click="closeApplyDialog">取消</el-button>
        <el-button type="primary" @click="submitApplication">提交申请</el-button>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const filterType = ref('')
const resourceList = ref([])
const showApplyDialog = ref(false)
const currentResource = ref(null)
const applyForm = ref({ resourceTitle: '', studentName: '', studentCollege: '', reason: '' })

const typeOptions = [
  { label: '全部', value: '', icon: '📋' },
  { label: '资金支持', value: '资金支持', icon: '💰' },
  { label: '导师指导', value: '导师指导', icon: '👨‍🏫' },
  { label: '场地提供', value: '场地提供', icon: '🏢' },
  { label: '设备支持', value: '设备支持', icon: '🔧' },
]

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
const getTypeIcon = (type) => ({ '资金支持':'💰','导师指导':'👨‍🏫','场地提供':'🏢','设备支持':'🔧' }[type] || '📦')
const getTypeKey = (type) => ({ '资金支持':'fund','导师指导':'mentor','场地提供':'venue','设备支持':'device' }[type] || 'default')

const loadResources = async () => {
  try {
    let url = '/api/resource/list'
    if (filterType.value) url = `/api/resource/type/${filterType.value}`
    const response = await request.get(url)
    resourceList.value = response.data || []
  } catch (error) { ElMessage.error('加载资源失败，请检查网络连接') }
}

const applyResource = (item) => {
  currentResource.value = item
  applyForm.value = {
    resourceTitle: item.title,
    studentName: localStorage.getItem('username') || '',
    studentCollege: localStorage.getItem('college') || '',
    reason: ''
  }
  showApplyDialog.value = true
}

const closeApplyDialog = () => { showApplyDialog.value = false; currentResource.value = null }

const submitApplication = async () => {
  if (!currentResource.value) return
  try {
    const studentId = localStorage.getItem('studentId')
    if (!studentId) { ElMessage.error('请先登录'); return }
    await request.post('/api/resource/apply', {
      resourceId: currentResource.value.id,
      studentId: parseInt(studentId),
      studentName: applyForm.value.studentName,
      studentCollege: applyForm.value.studentCollege
    })
    ElMessage.success('申请提交成功！')
    closeApplyDialog()
    loadResources()
  } catch (error) { ElMessage.error('提交申请失败，请稍后重试') }
}

onMounted(() => { loadResources() })
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
.filter-tabs { display: flex; gap: var(--spacing-sm); flex-wrap: wrap; }
.filter-tab { display: flex; align-items: center; gap: 6px; padding: 10px 18px; border: 1px solid var(--border-color); border-radius: var(--radius-round); background: var(--bg-card); font-size: var(--font-size-sm); color: var(--text-secondary); cursor: pointer; transition: all var(--transition-base); font-weight: 500; }
.filter-tab:hover { border-color: var(--color-primary-light); color: var(--color-primary); }
.filter-tab.active { background: var(--gradient-primary); color: #fff; border-color: transparent; }
.filter-tab__icon { font-size: 16px; }

/* 资源网格 */
.resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: var(--spacing-xl); }
.resource-card { background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); transition: all var(--transition-base); overflow: hidden; display: flex; flex-direction: column; }
.resource-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--color-primary-light); }
.resource-card__header { display: flex; align-items: flex-start; gap: var(--spacing-lg); padding: var(--spacing-xl) var(--spacing-xl) 0; }
.resource-card__type-badge { width: 48px; height: 48px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.badge--fund { background: #FFF8E6; } .badge--mentor { background: #EEF1FE; }
.badge--venue { background: #F0FBE6; } .badge--device { background: #FFF0F0; }
.badge--default { background: var(--border-color-light); }
.resource-card__header-info { flex: 1; min-width: 0; }
.resource-card__header-info h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin: 0 0 2px 0; line-height: 1.4; }
.resource-card__type-text { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.status-dot { padding: 3px 12px; border-radius: var(--radius-round); font-size: var(--font-size-xs); font-weight: 600; white-space: nowrap; flex-shrink: 0; }
.dot--active { background: var(--color-success-bg); color: var(--color-success); }
.dot--expired { background: var(--color-danger-bg); color: var(--color-danger); }

.resource-card__body { padding: var(--spacing-lg) var(--spacing-xl); flex: 1; }
.info-row { display: flex; margin-bottom: var(--spacing-sm); font-size: var(--font-size-sm); }
.info-row .label { color: var(--text-tertiary); width: 70px; flex-shrink: 0; }
.info-row .value { color: var(--text-primary); font-weight: 500; }
.text-danger { color: var(--color-danger) !important; }
.resource-card__desc { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; margin: var(--spacing-md) 0; padding: var(--spacing-md); background: var(--color-primary-bg-light); border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.resource-card__stats { display: flex; gap: var(--spacing-xl); font-size: var(--font-size-xs); color: var(--text-tertiary); padding-top: var(--spacing-md); border-top: 1px solid var(--border-color-light); }

.resource-card__footer { padding: var(--spacing-lg) var(--spacing-xl); border-top: 1px solid var(--border-color-light); }
.btn-apply { width: 100%; padding: 10px; border: none; border-radius: var(--radius-md); background: var(--gradient-primary); color: #fff; font-size: var(--font-size-base); font-weight: 600; cursor: pointer; transition: all var(--transition-base); }
.btn-apply:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(43,90,237,0.4); }
.btn-apply:disabled { background: #ccc; cursor: not-allowed; color: #999; }

/* 申请弹窗 */
.apply-form { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.apply-form__item label { display: block; font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-xs); }

/* 空状态 */
.state-box { text-align: center; padding: 80px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.state-box__icon { font-size: 64px; margin-bottom: var(--spacing-lg); }
.state-box__title { font-size: var(--font-size-xl); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-sm) 0; }
.state-box__hint { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; }

@media (max-width: 1024px) {
  .resource-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
}
@media (max-width: 768px) {
  .resource-grid { grid-template-columns: 1fr; }
  .filter-tabs { overflow-x: auto; flex-wrap: nowrap; padding-bottom: var(--spacing-sm); }
  .page-hero { padding: var(--spacing-xl); }
  .page-hero__title { font-size: var(--font-size-title); }
}
</style>
