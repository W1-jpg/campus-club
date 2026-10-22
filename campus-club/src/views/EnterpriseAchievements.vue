<template>
  <PageLayout userType="enterprise">
    <div class="manage-content">
      <!-- 页面头部 -->
      <div class="page-header">
        <div>
          <h2 class="page-header__title">优质成果浏览</h2>
          <p class="page-header__subtitle">发现优秀学生成果，收藏储备人才项目</p>
        </div>
      </div>

      <!-- 搜索栏 -->
      <div class="content-card search-bar">
        <div style="display:flex;gap:12px;">
          <el-input v-model="search" placeholder="搜索成果标题或类型" clearable @clear="load" style="max-width:400px">
            <template #append><el-button type="primary" @click="load">搜索</el-button></template>
          </el-input>
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" style="text-align:center;padding:60px 0;">
        <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      </div>

      <!-- 成果列表 -->
      <div v-else class="result-grid">
        <div class="result-card" v-for="item in list" :key="item.id" @click="openDetail(item)">
          <div class="card-hd">
            <el-tag size="small" :type="typeTag(item.type)">{{ item.type }}</el-tag>
            <el-button
              :type="item.isBookmarked ? 'warning' : ''"
              size="small" circle
              @click.stop="toggle(item)"
            >
              <el-icon :size="16"><StarFilled v-if="item.isBookmarked"/><Star v-else/></el-icon>
            </el-button>
          </div>
          <h4 class="card-title">{{ item.title }}</h4>
          <p class="card-desc">{{ item.description || '暂无描述' }}</p>
          <div class="card-meta">
            <span>{{ item.studentName || '匿名' }}</span>
            <span>{{ item.college }}</span>
          </div>
          <div class="card-ft">
            <span class="card-score">评分 {{ item.score || 0 }}</span>
            <span class="card-time">{{ fmt(item.createTime) }}</span>
          </div>
        </div>
        <el-empty v-if="list.length === 0" description="暂无成果" />
      </div>
    </div>

    <!-- ==================== 成果详情弹窗 ==================== -->
    <el-dialog v-model="showDetail" title="成果详情" width="750px" :close-on-click-modal="true" @close="detailItem = null">
      <div v-if="detailItem" class="detail-body">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="detail-section__title">📋 基本信息</h3>
          <div class="d-grid">
            <div class="d-row"><span class="d-label">成果标题</span><span class="d-value">{{ detailItem.title }}</span></div>
            <div class="d-row"><span class="d-label">成果类型</span><span class="d-value"><el-tag size="small" :type="typeTag(detailItem.type)">{{ detailItem.type }}</el-tag></span></div>
            <div class="d-row"><span class="d-label">所属社团</span><span class="d-value">{{ detailItem.communityName || detailItem.community || '未填写' }}</span></div>
            <div class="d-row"><span class="d-label">提交时间</span><span class="d-value">{{ fmt(detailItem.createTime) }}</span></div>
            <div class="d-row d-row--full" v-if="detailItem.description">
              <span class="d-label">成果描述</span>
              <span class="d-value d-value--desc">{{ detailItem.description }}</span>
            </div>
          </div>
        </div>

        <!-- 评分信息 -->
        <div class="detail-section">
          <h3 class="detail-section__title">⭐ 评审评分</h3>
          <div class="score-cards">
            <div class="score-card">
              <span class="score-card__val">{{ detailItem.score || 0 }}</span>
              <span class="score-card__lbl">教师评分</span>
            </div>
            <div class="score-card">
              <span class="score-card__val">{{ detailItem.expertScore || '--' }}</span>
              <span class="score-card__lbl">专家评分</span>
            </div>
            <div class="score-card">
              <span class="score-card__val">{{ detailItem.incubationScore || '--' }}</span>
              <span class="score-card__lbl">孵化评分</span>
            </div>
            <div class="score-card">
              <span class="score-card__val">
                <span :class="statusClass(detailItem)">{{ statusText(detailItem) }}</span>
              </span>
              <span class="score-card__lbl">当前状态</span>
            </div>
          </div>
        </div>

        <!-- 上传者信息 -->
        <div class="detail-section" v-if="detailStudent">
          <h3 class="detail-section__title">👤 上传者信息</h3>
          <div class="d-grid">
            <div class="d-row"><span class="d-label">姓名</span><span class="d-value">{{ detailStudent.realName || detailStudent.real_name || '未填写' }}</span></div>
            <div class="d-row"><span class="d-label">学号</span><span class="d-value">{{ detailStudent.username || '未填写' }}</span></div>
            <div class="d-row"><span class="d-label">手机</span><span class="d-value">{{ detailStudent.phone || '未设置' }}</span></div>
            <div class="d-row"><span class="d-label">邮箱</span><span class="d-value">{{ detailStudent.email || '未设置' }}</span></div>
            <div class="d-row"><span class="d-label">学院</span><span class="d-value">{{ detailStudent.college || '未设置' }}</span></div>
          </div>
        </div>

        <!-- 成果文件 -->
        <div class="detail-section">
          <h3 class="detail-section__title">📁 成果文件</h3>
          <div v-if="detailFiles.length > 0" class="file-grid">
            <div class="file-card" v-for="(f, i) in detailFiles" :key="i">
              <span class="file-card__icon">{{ fileIcon(f.type) }}</span>
              <div class="file-card__info">
                <span class="file-card__name" :title="f.name">{{ f.name }}</span>
                <span class="file-card__size">{{ f.sizeText || formatSize(f.size) }}</span>
              </div>
              <a :href="f.url" target="_blank" download class="file-card__dl" title="下载文件">⬇ 下载</a>
            </div>
          </div>
          <p v-else class="empty-hint">暂无上传文件</p>
        </div>

        <!-- 评语 / 评审详情 -->
        <div class="detail-section" v-if="detailItem.expertComment || detailItem.teacherComment">
          <h3 class="detail-section__title">💬 评审意见</h3>
          <div class="d-grid">
            <div class="d-row d-row--full" v-if="detailItem.teacherComment">
              <span class="d-label">教师评语</span>
              <span class="d-value d-value--desc">{{ detailItem.teacherComment }}</span>
            </div>
            <div class="d-row d-row--full" v-if="detailItem.expertComment">
              <span class="d-label">专家评语</span>
              <span class="d-value d-value--desc">{{ detailItem.expertComment }}</span>
            </div>
            <div class="d-row d-row--full" v-if="detailItem.reviewConclusion">
              <span class="d-label">评审结论</span>
              <span class="d-value">
                <el-tag :type="conclusionTag(detailItem.reviewConclusion)" size="small">{{ conclusionText(detailItem.reviewConclusion) }}</el-tag>
              </span>
            </div>
          </div>
        </div>

        <!-- 维度评分 -->
        <div class="detail-section" v-if="detailDims.length > 0">
          <h3 class="detail-section__title">📊 维度评分</h3>
          <div class="dim-chips">
            <span class="dim-chip" v-for="(d, i) in detailDims" :key="i">{{ d.name }}：{{ d.score }}/5（权重 {{ d.weight }}%）</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click.stop="toggle(detailItem)" :type="detailItem?.isBookmarked ? 'warning' : ''">
          {{ detailItem?.isBookmarked ? '⭐ 已收藏' : '☆ 收藏成果' }}
        </el-button>
        <el-button type="success" @click.stop="cooperate(detailItem)">发起合作</el-button>
        <el-button type="primary" @click="showDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Star, StarFilled, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const list = ref([]), search = ref(''), loading = ref(false)
const showDetail = ref(false)
const detailItem = ref(null)
const detailStudent = ref(null)
const detailFiles = ref([])
const detailDims = ref([])

const eid = () => parseInt(localStorage.getItem('enterpriseId') || '0')

onMounted(() => { load() })

const load = async () => {
  loading.value = true
  try {
    const r = await request.get('/api/enterprise/achievements', {
      params: { enterpriseId: eid(), search: search.value }
    })
    if (r.code === 200) {
      list.value = (r.data.achievements || []).map(a => ({
        ...a,
        isBookmarked: a.isBookmarked > 0
      }))
    }
  } catch (e) {
    console.error('加载成果失败:', e)
    // 降级：尝试从成果列表API加载
    try {
      const r = await request.get('/api/result/list')
      if (r.code === 200 && r.data) {
        list.value = (r.data || []).map(a => ({
          ...a, isBookmarked: false,
          studentName: a.studentName || '',
          reviewStatus: a.reviewStatus || 0
        }))
      }
    } catch (e2) { console.error('降级加载也失败:', e2) }
  } finally { loading.value = false }
}

const cooperate = async (item) => {
  if (!item) return
  try {
    const { value } = await ElMessageBox.prompt('请填写合作意向说明，例如合作方向、可提供的资源等', '发起合作', {
      inputType: 'textarea',
      inputPlaceholder: '我们对该成果很感兴趣，希望进一步沟通合作……',
      confirmButtonText: '发送',
      cancelButtonText: '取消',
      inputValidator: (v) => (v && v.trim() ? true : '请填写合作说明')
    })
    const res = await request.post('/api/enterprise/intents', { achievementId: item.id, message: value.trim() })
    if (res.code === 200) ElMessage.success('合作意向已发送')
    else ElMessage.error(res.msg || '发送失败')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.msg || '发送失败')
  }
}

const toggle = async (item) => {
  try {
    const r = await request.post('/api/enterprise/bookmark', {
      enterpriseId: eid(), achievementId: item.id
    })
    if (r.code === 200) item.isBookmarked = r.data.bookmarked
  } catch {}
}

const typeTag = t => ({
  '软件开发': 'primary', '学术论文': 'success', '科技发明': 'warning',
  '创新创业': 'danger', '艺术创作': 'info'
}[t] || '')

const fmt = d => {
  if (!d) return ''
  const dt = new Date(d)
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0')
}

const statusText = (item) => {
  if (item.status === 2) return '已打回'
  if (item.incubationStatus === 1) return '孵化中'
  if (item.incubationStatus === 2) return '孵化完成'
  if (item.reviewStatus === 2) return '评审通过'
  if (item.score > 0) return '已评分'
  return '待评分'
}
const statusClass = (item) => {
  if (item.status === 2) return 'st-reject'
  if (item.incubationStatus === 1) return 'st-incubating'
  if (item.incubationStatus === 2) return 'st-done'
  if (item.reviewStatus === 2) return 'st-pass'
  if (item.score > 0) return 'st-scored'
  return 'st-pending'
}
const conclusionText = (c) => ({ excellent: '优秀', good: '良好', pass: '合格', fail: '不合格' }[c] || c)
const conclusionTag = (c) => ({ excellent: 'success', good: '', pass: 'warning', fail: 'danger' }[c] || '')

const fileIcon = (type) => {
  if (!type) return '📄'
  if (type.includes('pdf')) return '📕'
  if (type.includes('doc')) return '📘'
  if (type.includes('zip') || type.includes('rar')) return '🗜️'
  if (type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return '🖼️'
  return '📄'
}
const formatSize = (bytes) => {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// ===== 打开详情 =====
const openDetail = async (item) => {
  detailItem.value = item
  detailStudent.value = null
  detailFiles.value = []
  detailDims.value = []
  showDetail.value = true

  // 获取学生信息
  if (item.studentId) {
    try {
      const res = await request.get(`/api/student/info?studentId=${item.studentId}`)
      if (res.code === 200) detailStudent.value = res.data
    } catch (e) { /* 静默 */ }
  }

  // 获取成果文件
  try {
    const res = await request.get(`/api/enterprise/achievement/${item.id}/files`)
    if (res.data) detailFiles.value = res.data || []
  } catch (e) { /* 静默 */ }

  // 获取维度评分（如有）
  if (item.dimension_scores) {
    try {
      detailDims.value = JSON.parse(item.dimension_scores)
    } catch { detailDims.value = [] }
  }
  // 也尝试从 API 获取
  if (detailDims.value.length === 0 && (item.reviewStatus === 2 || item.expertScore)) {
    try {
      const res = await request.get(`/api/enterprise/achievement/${item.id}/review-detail`)
      if (res.data && res.data.dimensionScores) {
        try { detailDims.value = JSON.parse(res.data.dimensionScores) } catch {}
      }
    } catch (e) { /* 静默 */ }
  }
}
</script>

<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

.page-header { margin-bottom: var(--spacing-xl); }
.page-header__title { font-size: var(--font-size-title); font-weight: 700; color: var(--text-primary); margin: 0 0 var(--spacing-xs) 0; }
.page-header__subtitle { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; }

.search-bar { margin-bottom: var(--spacing-lg); padding: var(--spacing-lg) var(--spacing-xl); }

.result-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-lg); }
.result-card {
  background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--spacing-xl);
  border: 1px solid var(--border-color); transition: all var(--transition-fast);
  display: flex; flex-direction: column; gap: var(--spacing-sm); cursor: pointer;
}
.result-card:hover {
  transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); border-color: var(--color-primary);
}
.card-hd { display: flex; justify-content: space-between; align-items: center; }
.card-title {
  font-size: var(--font-size-lg); font-weight: 600; color: var(--text-primary);
  margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.card-desc {
  font-size: var(--font-size-sm); color: var(--text-secondary);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0;
}
.card-meta { display: flex; gap: var(--spacing-md); font-size: var(--font-size-xs); color: var(--text-tertiary); }
.card-ft {
  display: flex; justify-content: space-between; margin-top: auto; padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-color);
}
.card-score { color: var(--color-warning); font-weight: 600; font-size: var(--font-size-sm); }
.card-time { color: var(--text-tertiary); font-size: var(--font-size-xs); }

/* ========== 详情弹窗 ========== */
.detail-body { display: flex; flex-direction: column; gap: var(--spacing-lg); max-height: 65vh; overflow-y: auto; padding-right: var(--spacing-sm); }
.detail-section { background: var(--bg-page); border-radius: var(--radius-md); padding: var(--spacing-lg); }
.detail-section__title { font-size: var(--font-size-lg); font-weight: 700; color: var(--text-primary); margin: 0 0 var(--spacing-md) 0; }

.d-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-sm) var(--spacing-xl); }
.d-row { display: flex; padding: var(--spacing-xs) 0; font-size: var(--font-size-sm); }
.d-row--full { grid-column: 1 / -1; flex-direction: column; }
.d-label { width: 80px; flex-shrink: 0; color: var(--text-tertiary); font-weight: 500; }
.d-row--full .d-label { width: auto; margin-bottom: 4px; }
.d-value { color: var(--text-primary); font-weight: 500; }
.d-value--desc { line-height: 1.7; font-weight: 400; color: var(--text-secondary); white-space: pre-wrap; }

/* 评分卡片组 */
.score-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-md); }
.score-card { text-align: center; padding: var(--spacing-lg) var(--spacing-md); background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
.score-card__val { display: block; font-size: 26px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.score-card__lbl { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.st-pass { color: var(--color-success); }
.st-scored { color: var(--color-primary); }
.st-incubating { color: var(--color-warning); }
.st-done { color: var(--color-success); }
.st-pending { color: var(--text-tertiary); }
.st-reject { color: var(--color-danger); }

/* 文件列表 */
.file-grid { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.file-card { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md); background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border-color); }
.file-card__icon { font-size: 28px; flex-shrink: 0; }
.file-card__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.file-card__name { font-size: var(--font-size-sm); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-card__size { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.file-card__dl { font-size: var(--font-size-sm); text-decoration: none; color: var(--color-primary); font-weight: 600; flex-shrink: 0; padding: 4px 12px; border-radius: var(--radius-sm); border: 1px solid var(--color-primary); transition: all var(--transition-fast); }
.file-card__dl:hover { background: var(--color-primary); color: #fff; }

.empty-hint { text-align: center; color: var(--text-tertiary); font-size: var(--font-size-sm); padding: var(--spacing-lg); }

/* 维度评分 */
.dim-chips { display: flex; flex-wrap: wrap; gap: var(--spacing-sm); }
.dim-chip { padding: 4px 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-round); font-size: var(--font-size-xs); color: var(--text-secondary); }

@media (max-width: 768px) {
  .result-grid { grid-template-columns: 1fr; }
  .d-grid { grid-template-columns: 1fr; }
  .score-cards { grid-template-columns: repeat(2, 1fr); }
}
</style>
