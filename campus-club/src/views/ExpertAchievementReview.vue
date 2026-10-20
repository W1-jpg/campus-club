<template>
  <PageLayout userType="expert">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">成果评审</h1>
          <p class="page-hero__subtitle">对赛事成果、创新成果进行专业评审</p>
        </div>
      </div>

      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="全部状态" clearable size="default" style="width:150px">
          <el-option label="全部" value="" />
          <el-option label="待评审" value="1" />
          <el-option label="已评审" value="2" />
        </el-select>
        <el-select v-model="filterType" placeholder="全部类型" clearable size="default" style="width:150px">
          <el-option v-for="t in allTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </div>

      <div v-if="filteredList.length > 0" class="review-list">
        <div class="review-card" v-for="item in filteredList" :key="item.id">
          <div class="review-card__top">
            <div class="review-card__info">
              <h3>{{ item.title }}</h3>
              <div class="info-grid">
                <span><span class="lbl">类型</span> {{ item.type }}</span>
                <span><span class="lbl">提交人</span> {{ item.studentName || '学生' }}</span>
                <span><span class="lbl">时间</span> {{ formatDate(item.createTime) }}</span>
                <span><span class="lbl">阶段评分</span> {{ item.score || 0 }}分</span>
              </div>
              <p class="review-card__desc" v-if="item.description">{{ item.description }}</p>
            </div>
            <span class="status-tag" :class="item.reviewStatus === 2 ? 'tag-done' : 'tag-pending'">
              {{ item.reviewStatus === 2 ? '已评审' : '待评审' }}
            </span>
          </div>
          <div class="review-card__footer">
            <button class="btn-view" @click="viewDetail(item)">查看详情</button>
            <button class="btn-score" v-if="item.reviewStatus !== 2" @click="openReview(item)">开始评审</button>
            <span class="done-text" v-else>评分：{{ item.expertScore || '--' }}分</span>
          </div>
        </div>
      </div>
      <div v-else class="state-box"><span>📋</span><p>暂无待评审的成果</p></div>
    </div>

    <!-- 评审弹窗 -->
    <el-dialog v-model="showDialog" title="成果评审" width="720px" @close="closeDialog">
      <div v-if="currentItem" class="review-dialog">
        <!-- 成果信息 -->
        <div class="rd-info">
          <h3>{{ currentItem.title }}</h3>
          <div class="rd-meta">
            <span>📂 {{ currentItem.type }}</span>
            <span>👤 {{ currentItem.studentName || '未知' }}</span>
            <span>⭐ 阶段评分 {{ currentItem.score || 0 }} | 孵化 {{ currentItem.incubationScore || 0 }}</span>
          </div>
          <p v-if="currentItem.description">{{ currentItem.description }}</p>
        </div>

        <!-- 成果文件 -->
        <div class="rd-files">
          <div class="rd-files__header">
            <h4>📁 成果资料</h4>
            <span class="file-count" v-if="files.length">{{ files.length }} 个文件</span>
            <span class="file-empty" v-else>暂无文件</span>
          </div>
          <div class="file-grid" v-if="files.length">
            <div class="file-card" v-for="(f, i) in files" :key="i">
              <span class="file-card__icon">{{ fileIcon(f.type) }}</span>
              <div class="file-card__info">
                <span class="file-card__name" :title="f.name">{{ f.name }}</span>
                <span class="file-card__size">{{ f.sizeText }}</span>
              </div>
              <a :href="f.url" target="_blank" class="file-card__dl" title="下载查看">⬇</a>
            </div>
          </div>
        </div>

        <!-- 评分维度 -->
        <div class="rd-criteria">
          <h4>评分维度</h4>
          <div v-for="(dim, i) in achieveDims" :key="i" class="dim-row">
            <span class="dim-label">{{ dim.label }}（权重 {{ dim.weight }}%）</span>
            <el-rate v-model="dim.score" :max="5" show-score />
          </div>
          <div class="dim-total">综合得分：<b>{{ achTotal }} 分</b></div>
        </div>

        <el-input type="textarea" v-model="reviewComment" :rows="3" placeholder="评审意见..." />
        <el-select v-model="reviewConclusion" placeholder="评审结论" style="width:100%;margin-top:12px">
          <el-option label="优秀" value="excellent" /><el-option label="良好" value="good" />
          <el-option label="合格" value="pass" /><el-option label="不合格" value="fail" />
        </el-select>
      </div>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitReview">提交评审</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" title="成果详情" width="650px" @close="detailItem = null">
      <div v-if="detailItem" class="detail-dialog">
        <!-- 基本信息 -->
        <div class="detail-section"><h3>📋 基本信息</h3>
          <div class="d-row"><span class="dl">标题</span><span class="dv">{{ detailItem.title }}</span></div>
          <div class="d-row"><span class="dl">类型</span><span class="dv">{{ detailItem.type }}</span></div>
          <div class="d-row"><span class="dl">提交人</span><span class="dv">{{ detailItem.studentName || '未知' }}</span></div>
          <div class="d-row"><span class="dl">时间</span><span class="dv">{{ formatDate(detailItem.createTime) }}</span></div>
          <div class="d-row"><span class="dl">描述</span><span class="dv">{{ detailItem.description || '无' }}</span></div>
          <div class="d-row"><span class="dl">评分</span><span class="dv score">{{ detailItem.score || 0 }} 分</span></div>
          <div class="d-row"><span class="dl">孵化评分</span><span class="dv score">{{ detailItem.incubationScore || 0 }} 分</span></div>
          <div class="d-row"><span class="dl">专家评分</span><span class="dv score">{{ detailItem.expertScore || '未评审' }}</span></div>
          <div class="d-row"><span class="dl">状态</span><span class="dv">{{ detailItem.reviewStatus === 2 ? '已评审' : '待评审' }}</span></div>
        </div>

        <!-- 上传者信息 -->
        <div class="detail-section" v-if="detailStudent"><h3>👤 上传者信息</h3>
          <div class="d-row"><span class="dl">姓名</span><span class="dv">{{ detailStudent.realName || detailStudent.real_name }}</span></div>
          <div class="d-row"><span class="dl">学号</span><span class="dv">{{ detailStudent.username }}</span></div>
          <div class="d-row"><span class="dl">手机</span><span class="dv">{{ detailStudent.phone || '未设置' }}</span></div>
          <div class="d-row"><span class="dl">邮箱</span><span class="dv">{{ detailStudent.email || '未设置' }}</span></div>
          <div class="d-row"><span class="dl">学院</span><span class="dv">{{ detailStudent.college || '未设置' }}</span></div>
        </div>

        <!-- 成果文件 -->
        <div class="detail-section"><h3>📁 成果资料</h3>
          <div v-if="detailFiles.length" class="file-grid">
            <div class="file-card" v-for="(f, i) in detailFiles" :key="i">
              <span class="file-card__icon">{{ fileIcon(f.type) }}</span>
              <div class="file-card__info">
                <span class="file-card__name" :title="f.name">{{ f.name }}</span>
                <span class="file-card__size">{{ f.sizeText }}</span>
              </div>
              <a :href="f.url" target="_blank" class="file-card__dl" title="下载">⬇</a>
            </div>
          </div>
          <p v-else class="empty-hint">暂无上传文件</p>
        </div>
      </div>
      <template #footer><el-button type="primary" @click="showDetail = false">关闭</el-button></template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const filterStatus = ref('')
const filterType = ref('')
const taskList = ref([])
const showDialog = ref(false)
const currentItem = ref(null)
const reviewComment = ref('')
const reviewConclusion = ref('')
const files = ref([])
const loadingFiles = ref(false)

const fileIcon = (type) => {
  if (!type) return '📄'
  if (type.includes('pdf')) return '📕'
  if (type.includes('doc')) return '📘'
  if (type.includes('zip') || type.includes('rar')) return '🗜️'
  if (type.includes('jpg') || type.includes('png') || type.includes('jpeg')) return '🖼️'
  return '📄'
}

const achieveDims = ref([
  { label: '创新性', weight: 30, score: 0 },
  { label: '完成度', weight: 25, score: 0 },
  { label: '实用性', weight: 20, score: 0 },
  { label: '规范性', weight: 15, score: 0 },
  { label: '整体评价', weight: 10, score: 0 },
])

const allTypes = computed(() => [...new Set(taskList.value.map(i => i.type).filter(Boolean))])
const filteredList = computed(() => {
  let list = taskList.value // 全部待评审成果
  if (filterStatus.value) list = list.filter(i => String(i.reviewStatus) === filterStatus.value)
  if (filterType.value) list = list.filter(i => i.type === filterType.value)
  return list
})
const achTotal = computed(() => Math.round(achieveDims.value.reduce((s, d) => s + (d.score / 5) * d.weight, 0)))
const formatDate = (d) => { if(!d) return ''; const t = new Date(d); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}` }

const loadTasks = async () => {
  try { const res = await request.get('/api/expert/tasks'); if (res.data) taskList.value = res.data || [] } catch (e) { console.error(e) }
}
const showDetail = ref(false)
const detailItem = ref(null)
const detailStudent = ref(null)
const detailFiles = ref([])

const viewDetail = async (item) => {
  detailItem.value = item
  detailStudent.value = null
  detailFiles.value = []
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
    const res = await request.get(`/api/expert/task/${item.id}/files`)
    if (res.data) detailFiles.value = res.data || []
  } catch (e) { /* 静默 */ }
}
const openReview = async (item) => {
  currentItem.value = item; files.value = []; loadingFiles.value = true
  achieveDims.value.forEach(d => d.score = 0)
  reviewComment.value = ''; reviewConclusion.value = ''
  showDialog.value = true
  // 异步加载成果文件
  try {
    const res = await request.get(`/api/expert/task/${item.id}/files`)
    if (res.data) files.value = res.data || []
  } catch (e) { console.error('加载文件失败:', e) }
  finally { loadingFiles.value = false }
}
const closeDialog = () => { showDialog.value = false; currentItem.value = null }
const submitReview = async () => {
  if (!reviewConclusion.value) reviewConclusion.value = 'pass'
  const expertId = localStorage.getItem('expertId') || 1
  try {
    const dimScores = JSON.stringify(achieveDims.value.map(d => ({ name: d.label, weight: d.weight, score: d.score })))
    const res = await request.post('/api/expert/review', {
      expertId, achievementId: currentItem.value.id, score: achTotal.value,
      comment: reviewComment.value, conclusion: reviewConclusion.value,
      dimensionScores: dimScores, reviewType: 'achievement'
    })
    if (res.code === 200) { ElMessage.success('评审提交成功'); closeDialog(); loadTasks() }
    else ElMessage.error(res.msg || '提交失败')
  } catch (e) { ElMessage.error('提交失败') }
}

onMounted(() => loadTasks())
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xl) var(--spacing-xxl); margin-bottom: var(--spacing-lg); color: var(--text-inverse); box-shadow: var(--shadow-md); }
.page-hero__title { font-size: var(--font-size-title); font-weight: 700; margin: 0 0 2px 0; }
.page-hero__subtitle { font-size: var(--font-size-sm); opacity: 0.8; margin: 0; }

.filter-bar { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap; }
.review-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.review-card { background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--spacing-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); transition: all var(--transition-base); }
.review-card:hover { box-shadow: var(--shadow-md); }
.review-card__top { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-lg); margin-bottom: var(--spacing-md); }
.review-card__info { flex: 1; min-width: 0; }
.review-card__info h3 { font-size: var(--font-size-lg); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-sm) 0; }
.info-grid { display: flex; flex-wrap: wrap; gap: var(--spacing-md); font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--spacing-sm); }
.lbl { color: var(--text-secondary); font-weight: 500; }
.review-card__desc { font-size: var(--font-size-sm); color: var(--text-secondary); margin: var(--spacing-sm) 0 0 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.review-card__footer { display: flex; gap: var(--spacing-sm); align-items: center; }

.status-tag { padding: 4px 12px; border-radius: var(--radius-round); font-size: 12px; font-weight: 600; white-space: nowrap; }
.tag-pending { background: var(--color-warning-bg); color: var(--color-warning); }
.tag-done { background: var(--color-success-bg); color: var(--color-success); }
.btn-view { padding: 6px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-secondary); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-base); }
.btn-view:hover { border-color: var(--color-primary); color: var(--color-primary); }
.btn-score { padding: 6px 20px; border: none; border-radius: var(--radius-md); background: var(--gradient-primary); color: #fff; font-size: var(--font-size-sm); font-weight: 600; cursor: pointer; transition: all var(--transition-base); }
.btn-score:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43,90,237,0.4); }
.done-text { font-size: var(--font-size-sm); color: var(--color-primary); font-weight: 600; }

.state-box { text-align: center; padding: var(--spacing-xxxl) var(--spacing-xl); background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.state-box span { font-size: 48px; display: block; margin-bottom: var(--spacing-md); }
.state-box p { color: var(--text-tertiary); font-size: var(--font-size-base); }

/* 评审弹窗 */
.review-dialog { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.rd-info h3 { font-size: var(--font-size-xl); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.rd-info p { color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.6; }
.rd-meta { display: flex; flex-wrap: wrap; gap: var(--spacing-md); font-size: var(--font-size-sm); color: var(--text-tertiary); margin-top: var(--spacing-sm); }
.rd-files { background: var(--bg-page); border-radius: var(--radius-md); padding: var(--spacing-lg); }
.rd-files__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
.rd-files__header h4 { font-size: var(--font-size-base); font-weight: 600; margin: 0; }
.file-count { font-size: var(--font-size-xs); color: var(--color-primary); }
.file-empty { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.file-grid { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.file-card { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm) var(--spacing-md); background: var(--bg-card); border-radius: var(--radius-sm); border: 1px solid var(--border-color); }
.file-card__icon { font-size: 24px; flex-shrink: 0; }
.file-card__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.file-card__name { font-size: var(--font-size-sm); color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-card__size { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.file-card__dl { font-size: 18px; text-decoration: none; color: var(--color-primary); flex-shrink: 0; transition: transform var(--transition-fast); }
.file-card__dl:hover { transform: scale(1.2); }

.rd-criteria { background: var(--bg-page); border-radius: var(--radius-md); padding: var(--spacing-lg); }
.rd-criteria h4 { font-size: var(--font-size-base); font-weight: 600; margin: 0 0 var(--spacing-md) 0; }
.dim-row { display: flex; align-items: center; justify-content: space-between; padding: var(--spacing-sm) 0; border-bottom: 1px solid var(--border-color-light); }
.dim-row:last-child { border-bottom: none; }
.dim-label { font-size: var(--font-size-sm); color: var(--text-secondary); }
.dim-total { text-align: right; font-size: var(--font-size-lg); color: var(--text-primary); margin-top: var(--spacing-md); padding-top: var(--spacing-sm); border-top: 2px solid var(--border-color); }

/* 详情弹窗 */
.detail-dialog { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.detail-section { background: var(--bg-page); border-radius: var(--radius-md); padding: var(--spacing-lg); }
.detail-section h3 { font-size: var(--font-size-lg); font-weight: 700; margin: 0 0 var(--spacing-md) 0; color: var(--text-primary); }
.d-row { display: flex; padding: var(--spacing-xs) 0; font-size: var(--font-size-sm); }
.dl { width: 80px; flex-shrink: 0; color: var(--text-tertiary); font-weight: 500; }
.dv { flex: 1; color: var(--text-primary); }
.dv.score { color: var(--color-primary); font-weight: 600; }
.empty-hint { text-align: center; color: var(--text-tertiary); font-size: var(--font-size-sm); padding: var(--spacing-lg); }

@media (max-width: 768px) {
  .review-card__top { flex-direction: column; }
  .info-grid { flex-direction: column; gap: var(--spacing-xs); }
  .dim-row { flex-direction: column; align-items: flex-start; gap: var(--spacing-sm); }
}
</style>
