<template>
  <PageLayout :userType="userType">
    <div class="view-content">
      <div class="page-hero" v-if="result">
        <div class="hero-top">
          <el-button class="back-button" @click="goBack">← 返回成果浏览</el-button>
          <div class="hero-badges">
            <span class="type-pill">{{ result.type || '未分类' }}</span>
            <span class="status-pill" :class="`status-${currentStatusType}`">{{ currentStatusText }}</span>
          </div>
        </div>
        <h1 class="hero-title">{{ result.title }}</h1>
        <div class="hero-meta">
          <span>👤 {{ result.studentName || ('学生 ' + (result.studentId || '')) }}</span>
          <span v-if="result.college">🏫 {{ result.college }}</span>
          <span>🕒 {{ formatDate(result.createTime) }}</span>
          <span>👁 {{ result.viewCount || 0 }} 浏览</span>
          <span>❤ {{ result.likeCount || 0 }} 点赞</span>
          <span>💬 {{ comments.length }} 评论</span>
        </div>
      </div>

      <div class="detail-grid" v-if="result">
        <div class="main-col">
          <el-card class="content-card" shadow="never">
            <div class="card-head">
              <h3>成果描述</h3>
            </div>
            <p class="description">{{ result.description || '暂无成果描述' }}</p>

            <div class="divider"></div>

            <div class="card-head">
              <h3>成果文件</h3>
              <span class="count">{{ allFiles.length }} 个文件</span>
            </div>

            <div class="file-grid" v-if="allFiles.length">
              <div class="file-card" v-for="(file, index) in allFiles" :key="index">
                <div class="file-icon">{{ fileIcon(file) }}</div>
                <div class="file-info">
                  <span class="file-name" :title="file.name">{{ file.name }}</span>
                  <span class="file-meta">{{ file.type || '文件' }}<template v-if="file.size"> · {{ formatSize(file.size) }}</template></span>
                </div>
                <el-button class="download-btn" @click="downloadFile(file.url, file.name)">下载</el-button>
              </div>
            </div>
            <el-empty v-else description="暂无上传文件" :image-size="76" />

            <div class="action-bar">
              <el-button
                :type="result.isLiked ? 'danger' : 'primary'"
                class="like-button"
                @click="likeResult"
              >
                {{ result.isLiked ? '❤ 已点赞' : '♡ 点赞' }}（{{ result.likeCount || 0 }}）
              </el-button>
              <el-button
                v-if="String(result.reviewStatus) === '2' && userType === 'student'"
                class="appeal-button"
                @click="appealReview"
              >
                申请复核
              </el-button>
            </div>
          </el-card>

          <el-card class="content-card comments-card" shadow="never">
            <div class="card-head">
              <h3>评论</h3>
              <span class="count">{{ comments.length }} 条</span>
            </div>

            <div class="comment-form">
              <el-input
                v-model="commentForm.content"
                type="textarea"
                :rows="3"
                maxlength="500"
                show-word-limit
                placeholder="写下你的评论..."
              />
              <div class="comment-form__footer">
                <el-button type="primary" class="submit-comment-button" @click="addComment">发表评论</el-button>
              </div>
            </div>

            <div class="comment-list" v-if="comments.length">
              <div class="comment-item" v-for="comment in comments" :key="comment.id">
                <div class="avatar">{{ roleLabel(comment.userType).slice(0, 1) }}</div>
                <div class="comment-body">
                  <div class="comment-top">
                    <b>{{ roleLabel(comment.userType) }}</b>
                    <span>{{ formatDate(comment.createTime) }}</span>
                  </div>
                  <p>{{ comment.content }}</p>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无评论，来发表第一条评论吧" :image-size="76" />
          </el-card>
        </div>

        <aside class="side-col">
          <el-card class="side-card" shadow="never">
            <h4>成果信息</h4>
            <div class="info-row"><span>成果类型</span><b>{{ result.type || '未分类' }}</b></div>
            <div class="info-row"><span>所属学院</span><b>{{ result.college || '未填写' }}</b></div>
            <div class="info-row"><span>教师评分</span><b class="score">{{ result.score || '未评分' }}</b></div>
            <div class="info-row"><span>孵化评分</span><b class="score">{{ result.incubationScore || '未评分' }}</b></div>
            <div class="info-row"><span>专家评分</span><b class="score">{{ result.expertScore || '未评审' }}</b></div>
            <div class="info-row">
              <span>成果状态</span>
              <el-tag :type="currentStatusType" effect="light">{{ currentStatusText }}</el-tag>
            </div>
          </el-card>

          <el-card class="side-card" shadow="never">
            <h4>评审进度</h4>
            <div class="timeline">
              <div v-for="(step, index) in reviewSteps" :key="index" :class="['timeline-item', { done: step.done }]">
                <span class="timeline-dot"></span>
                <div class="timeline-content">
                  <b>{{ step.label }}</b>
                  <p>{{ step.desc }}</p>
                </div>
              </div>
            </div>
          </el-card>
        </aside>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const route = useRoute()
const userType = ref(localStorage.getItem('userType') || 'student')
const result = ref(null)
const commentForm = ref({ content: '' })
const commentFormRef = ref(null)

const comments = computed(() => result.value?.comments || [])
const allFiles = computed(() => {
  const r = result.value
  if (!r) return []
  const list = [...(r.files || []), ...(r.clubFiles || []), ...(r.achievementFiles || [])]
  if (!list.length && r.fileName) {
    list.push({ name: r.fileName, url: r.filePath, type: '文件' })
  }
  return list.map(f => ({
    name: f.name || f.fileName || '未命名文件',
    url: f.url || f.fileUrl,
    type: f.type || f.fileType || '文件',
    size: f.size || f.fileSize
  }))
})

const reviewStatusNumber = computed(() => Number(result.value?.reviewStatus) || 0)
const reviewStatusText = computed(() => ({ 0: '待审核', 1: '评审中', 2: '已通过', 3: '已打回' }[reviewStatusNumber.value] || '待审核'))
const reviewStatusType = computed(() => ({ 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }[reviewStatusNumber.value] || 'info'))
const currentStatusText = computed(() => {
  const rs = reviewStatusNumber.value
  const incubation = Number(result.value?.incubationStatus) || 0
  if (rs === 3) return '已打回'
  if (incubation === 1) return '孵化中'
  if (incubation === 2) return '孵化完成'
  if (rs === 2) return '已通过'
  if (rs === 1) return '评审中'
  return '待审核'
})
const currentStatusType = computed(() => {
  const text = currentStatusText.value
  if (text === '已打回') return 'danger'
  if (text === '已通过' || text === '孵化完成') return 'success'
  if (text === '评审中' || text === '孵化中') return 'warning'
  return 'info'
})
const reviewSteps = computed(() => {
  const r = result.value || {}
  const status = reviewStatusNumber.value
  return [
    { label: '提交成果', desc: '学生上传成果材料', done: true },
    { label: '教师评分', desc: '教师完成阶段评分', done: Number(r.score) > 0 },
    { label: '专家评审', desc: '专家完成评审', done: status === 2 },
    { label: '评审结果', desc: status === 3 ? '成果已打回' : '成果已通过', done: status === 2 || status === 3 }
  ]
})

const getUserId = () => localStorage.getItem('studentId') || localStorage.getItem('teacherId') || localStorage.getItem('adminId')
const goBack = () => {
  const homeMap = { student: '/成果浏览', teacher: '/教师成果浏览' }
  router.push(homeMap[userType.value] || '/成果浏览')
}

const roleLabel = (type) => ({ student: '学生', teacher: '教师', expert: '专家', enterprise: '企业', admin: '管理员' }[type] || '用户')
const fileIcon = (file) => {
  const name = String(file?.name || file?.type || '').toLowerCase()
  if (name.includes('pdf')) return '📕'
  if (name.includes('doc')) return '📘'
  if (name.includes('zip') || name.includes('rar')) return '🗜️'
  if (name.includes('png') || name.includes('jpg') || name.includes('jpeg') || name.includes('webp')) return '🖼️'
  return '📄'
}
const formatSize = (size) => {
  const n = Number(size)
  if (!n) return ''
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}
const formatDate = (date) => date ? new Date(date).toLocaleString('zh-CN') : ''

const loadResultDetail = async () => {
  try {
    const res = await request({
      url: `/api/result/detail/${route.params.id}`,
      method: 'get',
      params: { userId: getUserId(), userType: userType.value }
    })
    if (res.code === 200 && res.data) {
      result.value = res.data
    } else {
      ElMessage.error(res.msg || '成果不存在')
      goBack()
    }
  } catch (error) {
    ElMessage.error('成果不存在')
    goBack()
  }
}

const incrementView = async () => {
  try {
    await request({ url: `/api/result/view/${route.params.id}`, method: 'post' })
  } catch (e) { /* 浏览量统计失败不影响浏览 */ }
}

const appealReview = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请填写申请复核的理由', '申请复核', {
      inputType: 'textarea',
      inputPlaceholder: '例如：认为评审分数与成果实际水平不符，理由如下……',
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputValidator: (v) => (v && v.trim() ? true : '请填写复核理由')
    })
    const res = await request.post('/api/result/appeal', { achievementId: result.value.id, reason: value.trim() })
    if (res.code === 200) ElMessage.success('复核申请已提交')
    else ElMessage.error(res.msg || '提交失败')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.msg || '提交失败')
  }
}

const likeResult = async () => {
  try {
    const userId = getUserId()
    if (!userId || !userType.value) { ElMessage.error('请先登录'); return }
    const url = result.value.isLiked ? '/api/result/unlike' : '/api/result/like'
    const res = await request({ url, method: 'post', params: { achievementId: result.value.id, userId, userType: userType.value } })
    if (res.code === 200) {
      result.value.isLiked = !result.value.isLiked
      result.value.likeCount = (result.value.likeCount || 0) + (result.value.isLiked ? 1 : -1)
      ElMessage.success(result.value.isLiked ? '点赞成功' : '已取消点赞')
    } else {
      ElMessage.error(res.msg || '点赞失败')
    }
  } catch (error) {
    ElMessage.error(error.msg || '点赞失败')
  }
}

const addComment = async () => {
  try {
    const userId = getUserId()
    if (!userId || !userType.value) { ElMessage.error('请先登录'); return }
    if (!commentForm.value.content) { ElMessage.error('请输入评论内容'); return }
    const res = await request({ url: '/api/result/comment', method: 'post', data: { achievementId: result.value.id, userId, userType: userType.value, content: commentForm.value.content } })
    if (res.code === 200) {
      ElMessage.success('评论成功')
      commentForm.value.content = ''
      loadResultDetail()
    } else {
      ElMessage.error(res.msg || '评论失败')
    }
  } catch (error) {
    ElMessage.error(error.msg || '评论失败')
  }
}

const downloadFile = (url, fileName) => {
  if (url && typeof url === 'string') {
    if (!fileName) {
      const urlParts = url.split('/')
      fileName = decodeURIComponent(urlParts[urlParts.length - 1])
    }
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    ElMessage.success('文件下载成功！')
  } else if (fileName) {
    const content = `这是${fileName}的模拟内容`
    const blob = new Blob([content], { type: 'text/plain' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100)
    ElMessage.success('文件下载成功！')
  } else {
    ElMessage.info('下载功能开发中')
  }
}

onMounted(async () => { await incrementView(); await loadResultDetail() })
</script>

<style scoped>
.view-content {
  max-width: var(--content-max-width-wide);
  margin: 0 auto;
  padding: var(--spacing-xl);
}

/* 顶部 Hero */
.page-hero {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-xxl);
  margin-bottom: var(--spacing-lg);
  color: var(--text-inverse);
  background: var(--gradient-hero);
  box-shadow: var(--shadow-md);
}
.page-hero::after {
  content: '';
  position: absolute;
  right: -60px;
  top: -80px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.hero-top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}
.back-button {
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.back-button:hover {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}
.hero-badges {
  display: flex;
  align-items: center;
  gap: 10px;
}
.type-pill,
.status-pill {
  padding: 6px 16px;
  border-radius: var(--radius-round);
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.status-pill.status-success {
  background: rgba(16, 185, 129, 0.22);
  border-color: rgba(110, 231, 183, 0.7);
}
.status-pill.status-danger {
  background: rgba(239, 68, 68, 0.26);
  border-color: rgba(254, 202, 202, 0.75);
}
.status-pill.status-warning {
  background: rgba(245, 158, 11, 0.24);
  border-color: rgba(253, 230, 138, 0.75);
}
.status-pill.status-info {
  background: rgba(255, 255, 255, 0.14);
}
.hero-title {
  position: relative;
  z-index: 1;
  margin: 0 0 var(--spacing-md);
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.35;
}
.hero-meta {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.88);
}

/* 主体布局 */
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--spacing-lg);
  align-items: start;
}
.main-col, .side-col {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  min-width: 0;
}
.content-card, .side-card {
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-card);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}
.card-head h3 {
  position: relative;
  margin: 0;
  padding-left: 12px;
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}
.card-head h3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 3px;
  bottom: 3px;
  width: 4px;
  border-radius: 4px;
  background: var(--gradient-primary);
}
.count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}
.description {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.9;
  font-size: var(--font-size-base);
  white-space: pre-wrap;
}
.divider {
  height: 1px;
  margin: var(--spacing-xl) 0;
  background: var(--border-color-light);
}

/* 文件 */
.file-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}
.file-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius-md);
  background: var(--bg-page);
  transition: all var(--transition-base);
}
.file-card:hover {
  border-color: rgba(43, 90, 237, 0.35);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: var(--color-primary-bg);
  font-size: 20px;
  flex-shrink: 0;
}
.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.file-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: 500;
}
.file-meta {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}
.download-btn {
  flex-shrink: 0;
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: transparent;
}
.download-btn:hover {
  background: var(--color-primary);
  color: #fff;
}

/* 操作区 */
.action-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px dashed var(--border-color);
}
.like-button {
  min-width: 150px;
  height: 42px;
  border-radius: var(--radius-round);
  font-weight: 600;
}
.appeal-button {
  height: 42px;
  border-radius: var(--radius-round);
}

/* 评论 */
.comments-card {
  margin-bottom: var(--spacing-xl);
}
.comment-form {
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--bg-page);
  border: 1px solid var(--border-color-light);
}
.comment-form__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-sm);
}
.submit-comment-button {
  border-radius: var(--radius-round);
  min-width: 112px;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
.comment-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--bg-page);
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-weight: 700;
  background: var(--gradient-primary);
}
.comment-body {
  flex: 1;
  min-width: 0;
}
.comment-top {
  display: flex;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: 6px;
}
.comment-top b {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}
.comment-top span {
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}
.comment-body p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: var(--font-size-sm);
  white-space: pre-wrap;
}

/* 侧栏 */
.side-card h4 {
  margin: 0 0 var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color-light);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-weight: 700;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md);
  padding: 10px 0;
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  border-bottom: 1px dashed var(--border-color-light);
}
.info-row:last-child {
  border-bottom: none;
}
.info-row b {
  color: var(--text-primary);
  font-weight: 600;
  text-align: right;
}
.info-row b.score {
  color: var(--color-primary);
  font-size: var(--font-size-lg);
}
.timeline {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.timeline-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-left: 4px;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 16px;
  bottom: -18px;
  width: 2px;
  background: var(--border-color-light);
}
.timeline-item:last-child::before {
  display: none;
}
.timeline-dot {
  position: relative;
  z-index: 1;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #fff;
  border: 2px solid var(--border-color);
}
.timeline-item.done .timeline-dot {
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px var(--color-primary-bg);
}
.timeline-content b {
  display: block;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}
.timeline-content p {
  margin: 3px 0 0;
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}

@media (max-width: 900px) {
  .detail-grid { grid-template-columns: 1fr; }
  .page-hero { padding: var(--spacing-lg); }
  .hero-meta { gap: var(--spacing-sm) var(--spacing-md); }
  .action-bar { flex-direction: column; }
  .like-button, .appeal-button { width: 100%; }
  .view-content { padding: var(--spacing-md); }
}
</style>
