<template>
  <PageLayout userType="student">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">我的孵化</h1>
          <p class="page-hero__subtitle">跟踪你的成果孵化进度，见证创意变为现实</p>
        </div>
      </div>

      <!-- 状态统计 -->
      <div class="stats-overview" v-if="incubationList.length > 0">
        <div class="mini-stat">
          <span class="mini-stat__num">{{ incubationList.length }}</span>
          <span class="mini-stat__label">全部孵化</span>
        </div>
        <div class="mini-stat mini-stat--active">
          <span class="mini-stat__num">{{ incubationList.filter(i => i.incubationStatus === 1).length }}</span>
          <span class="mini-stat__label">孵化中</span>
        </div>
        <div class="mini-stat mini-stat--done">
          <span class="mini-stat__num">{{ incubationList.filter(i => i.incubationStatus === 2 || i.incubationScore > 0).length }}</span>
          <span class="mini-stat__label">已完成</span>
        </div>
        <div class="mini-stat mini-stat--review">
          <span class="mini-stat__num">{{ incubationList.filter(i => i.reviewStatus === 1).length }}</span>
          <span class="mini-stat__label">评审中</span>
        </div>
      </div>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="全部状态" clearable size="large" style="width: 180px">
          <el-option label="全部状态" value="" />
          <el-option label="孵化中" value="1" />
          <el-option label="孵化完成" value="2" />
          <el-option label="专家评审中" value="3" />
        </el-select>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="state-box">
        <div class="loading-spinner"></div>
        <p>正在加载孵化数据...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="incubationList.length === 0" class="state-box">
        <div class="state-box__icon">🚀</div>
        <p class="state-box__title">暂无孵化成果</p>
        <p class="state-box__hint">当你的成果评分高于80分时，将自动进入孵化流程</p>
        <el-button type="primary" @click="$router.push('/成果上传')">去上传成果</el-button>
      </div>

      <!-- 孵化列表 -->
      <div v-else class="incubation-list">
        <div class="incubation-card" v-for="item in filteredList" :key="item.id">
          <div class="incubation-card__header">
            <div class="incubation-card__title-row">
              <h3>{{ item.title }}</h3>
              <span class="status-tag" :class="getStatusClass(item)">{{ getStatusText(item) }}</span>
            </div>
          </div>

          <div class="incubation-card__body">
            <div class="info-grid">
              <div class="info-cell">
                <span class="info-cell__label">成果类型</span>
                <span class="info-cell__value">{{ item.type || '未知' }}</span>
              </div>
              <div class="info-cell">
                <span class="info-cell__label">进入孵化</span>
                <span class="info-cell__value">{{ formatDate(item.createTime) }}</span>
              </div>
              <div class="info-cell">
                <span class="info-cell__label">成果评分</span>
                <span class="info-cell__value score">{{ item.score || 0 }} 分</span>
              </div>
            </div>

            <div class="incubation-card__desc" v-if="item.description">
              <span class="desc-label">成果描述</span>
              <p>{{ item.description }}</p>
            </div>

            <!-- 孵化进度 -->
            <div class="progress-block" v-if="item.incubationStatus === 1">
              <div class="progress-block__header">
                <span>🚀 孵化进度</span>
                <span class="progress-block__pct">60%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar__fill" style="width:60%"></div>
              </div>
            </div>

            <!-- 评审进度 -->
            <div class="progress-block progress-block--review" v-if="item.reviewStatus === 1 || item.reviewStatus === 2">
              <div class="progress-block__header">
                <span>🔍 评审进度</span>
                <span class="progress-block__pct">{{ item.reviewProgress || 0 }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-bar__fill progress-bar__fill--review" :style="{ width: (item.reviewProgress || 0) + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="incubation-card__footer">
            <button class="btn-view" @click="viewDetail(item.id)">查看详情 →</button>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const loading = ref(false)
const filterStatus = ref('')
const incubationList = ref([])

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const getStatusText = (item) => {
  if (item.reviewStatus === 1) return '专家评审中'
  if (item.reviewStatus === 2) return '评审通过'
  if (item.reviewStatus === 3) return '评审打回'
  if (item.incubationStatus === 1) return '孵化中'
  if (item.incubationStatus === 2 || item.incubationScore > 0) return '孵化完成'
  return '未知'
}

const getStatusClass = (item) => {
  if (item.reviewStatus === 1) return 'tag-reviewing'
  if (item.reviewStatus === 2) return 'tag-review-pass'
  if (item.reviewStatus === 3) return 'tag-review-reject'
  if (item.incubationStatus === 1) return 'tag-incubating'
  if (item.incubationStatus === 2 || item.incubationScore > 0) return 'tag-completed'
  return ''
}

const filteredList = computed(() => {
  if (!filterStatus.value) return incubationList.value
  return incubationList.value.filter(item => {
    if (filterStatus.value === '3') return item.reviewStatus === 1 || item.reviewStatus === 2
    return item.incubationStatus && item.incubationStatus.toString() === filterStatus.value
  })
})

const loadIncubations = async () => {
  try {
    loading.value = true
    const studentId = localStorage.getItem('studentId')
    const userId = studentId || localStorage.getItem('teacherId') || localStorage.getItem('adminId')
    const userType = localStorage.getItem('userType')
    if (!studentId) { ElMessage.error('请先登录'); router.push('/login/student'); return }
    const res = await request({ url: '/api/result/my', method: 'get', params: { studentId, userId, userType } })
    if (res.code === 200) incubationList.value = res.data || []
    else ElMessage.error(res.msg || '获取孵化成果失败')
  } catch (error) { ElMessage.error('获取孵化成果失败，请检查网络') }
  finally { loading.value = false }
}

const viewDetail = (id) => router.push(`/成果详情/${id}`)

onMounted(() => { loadIncubations() })
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

/* 统计概览 */
.stats-overview { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl); }
.mini-stat { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--spacing-lg); text-align: center; border: 1px solid var(--border-color); transition: all var(--transition-base); }
.mini-stat:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.mini-stat__num { display: block; font-size: 28px; font-weight: 700; color: var(--text-primary); }
.mini-stat__label { display: block; font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 4px; font-weight: 500; }
.mini-stat--active { border-color: var(--color-primary); background: var(--color-primary-bg-light); }
.mini-stat--done { border-color: var(--color-success); background: var(--color-success-bg); }
.mini-stat--review { border-color: var(--color-warning); background: var(--color-warning-bg); }

/* 筛选栏 */
.filter-bar { margin-bottom: var(--spacing-xl); }

/* 通用状态 */
.state-box { text-align: center; padding: 80px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.state-box__icon { font-size: 64px; margin-bottom: var(--spacing-lg); animation: bounce 2s infinite; }
@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
.state-box__title { font-size: var(--font-size-xl); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-sm) 0; }
.state-box__hint { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0 0 var(--spacing-xl) 0; }

.loading-spinner { width: 40px; height: 40px; border: 3px solid var(--border-color-light); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto var(--spacing-lg); }
@keyframes spin { to { transform: rotate(360deg); } }

/* 孵化卡片 */
.incubation-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.incubation-card { background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); overflow: hidden; transition: all var(--transition-base); }
.incubation-card:hover { box-shadow: var(--shadow-md); }
.incubation-card__header { padding: var(--spacing-xl) var(--spacing-xl) 0; }
.incubation-card__title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-lg); }
.incubation-card__title-row h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin: 0; flex: 1; line-height: 1.4; }

.status-tag { padding: 4px 14px; border-radius: var(--radius-round); font-size: var(--font-size-xs); font-weight: 600; color: #fff; white-space: nowrap; flex-shrink: 0; }
.tag-incubating { background: var(--gradient-primary); }
.tag-completed { background: linear-gradient(135deg, var(--color-success), var(--color-success-light)); }
.tag-reviewing { background: var(--gradient-primary); }
.tag-review-pass { background: linear-gradient(135deg, var(--color-success), var(--color-success-light)); }
.tag-review-reject { background: linear-gradient(135deg, var(--color-danger), var(--color-danger-light)); }

.incubation-card__body { padding: var(--spacing-xl); }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
.info-cell { }
.info-cell__label { display: block; font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: 2px; }
.info-cell__value { font-size: var(--font-size-base); color: var(--text-primary); font-weight: 500; }
.info-cell__value.score { color: var(--color-primary); font-weight: 700; font-size: var(--font-size-xl); }

.incubation-card__desc { margin-bottom: var(--spacing-lg); }
.desc-label { font-size: var(--font-size-xs); color: var(--text-tertiary); display: block; margin-bottom: var(--spacing-xs); }
.incubation-card__desc p { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; margin: 0; padding: var(--spacing-md); background: var(--color-primary-bg-light); border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); }

.progress-block { padding: var(--spacing-lg); background: var(--color-primary-bg); border-radius: var(--radius-md); margin-bottom: var(--spacing-md); }
.progress-block--review { background: var(--color-warning-bg); }
.progress-block__header { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-sm); }
.progress-block__pct { color: var(--color-primary); font-weight: 700; }
.progress-bar { height: 8px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden; }
.progress-bar__fill { height: 100%; background: var(--gradient-primary); border-radius: 4px; transition: width 0.6s ease; position: relative; }
.progress-bar__fill--review { background: linear-gradient(135deg, var(--color-warning), var(--color-warning-light)); }
.progress-bar__fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent); animation: shimmer 2s infinite; }
@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }

.incubation-card__footer { padding: var(--spacing-lg) var(--spacing-xl); border-top: 1px solid var(--border-color-light); }
.btn-view { padding: 10px 28px; border: none; border-radius: var(--radius-md); background: var(--gradient-primary); color: #fff; font-size: var(--font-size-base); font-weight: 500; cursor: pointer; transition: all var(--transition-base); }
.btn-view:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(43,90,237,0.4); }

@media (max-width: 1024px) {
  .stats-overview { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .view-content { padding: var(--spacing-md); }
  .page-hero { padding: var(--spacing-lg); }
  .page-hero__title { font-size: var(--font-size-xl); }
  .stats-overview { grid-template-columns: repeat(2, 1fr); }
  .info-grid { grid-template-columns: 1fr; }
  .incubation-card__title-row { flex-direction: column; }
}
</style>
