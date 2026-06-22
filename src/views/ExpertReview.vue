<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-header">
        <h1 class="page-header__title">专家评审</h1>
      </div>

      <div class="filter-bar">
        <select v-model="filterStatus" class="filter-select">
          <option value="">全部状态</option>
          <option value="pending">待评审</option>
          <option value="reviewed">已评审</option>
        </select>
      </div>

      <div class="review-list">
        <div class="content-card" v-for="item in reviewList" :key="item.id">
          <div class="card-header">
            <h3>{{ item.title }}</h3>
            <span class="status-badge" :class="getStatusClass(item.reviewStatus)">{{ getStatusText(item.reviewStatus) }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">成果类型：</span>
              <span class="value">{{ item.type }}</span>
            </div>
            <div class="info-row">
              <span class="label">申报人：</span>
              <span class="value">学生{{ item.studentId }}</span>
            </div>
            <div class="info-row">
              <span class="label">申报时间：</span>
              <span class="value">{{ formatTime(item.createTime) }}</span>
            </div>
            <div class="description">
              <span class="label">成果简介：</span>
              <span class="value">{{ item.description }}</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-view" @click="viewDetail(item)">查看详情</button>
            <button class="btn-review" v-if="item.reviewStatus === 1" @click="openReviewDialog(item)">开始评审</button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showReviewDialog" title="专家评审" width="550px" @close="closeReviewDialog">
      <div class="achievement-info">
        <h3>{{ currentReview?.title }}</h3>
        <p>{{ currentReview?.description }}</p>
      </div>
      <div class="form-group">
        <label>评分（0-100）</label>
        <input type="number" v-model="reviewForm.score" min="0" max="100" placeholder="请输入评分" />
      </div>
      <div class="form-group">
        <label>评审意见</label>
        <textarea v-model="reviewForm.comment" placeholder="请输入评审意见" rows="6"></textarea>
      </div>
      <div class="form-group">
        <label>评审结论</label>
        <select v-model="reviewForm.conclusion" class="form-select">
          <option value="">请选择</option>
          <option value="excellent">优秀</option>
          <option value="good">良好</option>
          <option value="pass">合格</option>
          <option value="fail">不合格</option>
        </select>
      </div>
      <div class="form-group">
        <label>评审进度</label>
        <div class="progress-container">
          <input type="range" v-model.number="reviewForm.progress" min="0" max="100" class="progress-slider" />
          <span class="progress-value">{{ reviewForm.progress }}%</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeReviewDialog">取消</el-button>
          <el-button type="danger" @click="rejectReview">打回</el-button>
          <el-button type="success" @click="passReview">通过</el-button>
          <el-button type="primary" @click="submitReview">提交评审</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="项目详情" width="600px" @close="closeDetailDialog">
      <div class="detail-section">
        <h3>项目信息</h3>
        <div class="detail-row" v-for="field in detailFields" :key="field.key">
          <span class="detail-label">{{ field.label }}</span>
          <span class="detail-value">{{ currentDetail?.[field.key] || '' }}</span>
        </div>
      </div>
      <div class="detail-section" v-if="currentStudent">
        <h3>上传者信息</h3>
        <div class="detail-row"><span class="detail-label">姓名：</span><span class="detail-value">{{ currentStudent.realName }}</span></div>
        <div class="detail-row"><span class="detail-label">学号：</span><span class="detail-value">{{ currentStudent.username }}</span></div>
        <div class="detail-row"><span class="detail-label">手机号：</span><span class="detail-value">{{ currentStudent.phone }}</span></div>
        <div class="detail-row"><span class="detail-label">邮箱：</span><span class="detail-value">{{ currentStudent.email }}</span></div>
        <div class="detail-row"><span class="detail-label">学院：</span><span class="detail-value">{{ currentStudent.college }}</span></div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="closeDetailDialog">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const filterStatus = ref('')
const reviewList = ref([])
const showReviewDialog = ref(false)
const showDetailDialog = ref(false)
const currentReview = ref(null)
const currentDetail = ref(null)
const currentStudent = ref(null)
const reviewForm = ref({ score: '', comment: '', conclusion: '', progress: 0 })

const formatTime = (time) => time ? new Date(time).toLocaleString('zh-CN') : ''

const getStatusText = (status) => ({ 0: '未评审', 1: '待评审', 2: '已评审' }[status] || status)
const getStatusClass = (status) => ({ 0: 'not-reviewed', 1: 'pending', 2: 'reviewed' }[status] || '')

const detailFields = [
  { key: 'title', label: '项目名称：' },
  { key: 'type', label: '项目类型：' },
  { key: 'createTime', label: '上传时间：' },
  { key: 'description', label: '项目描述：' }
]

const loadReviews = async () => {
  try {
    const userId = localStorage.getItem('teacherId') || localStorage.getItem('studentId') || localStorage.getItem('adminId')
    const userType = localStorage.getItem('userType')
    const college = localStorage.getItem('college')
    if (userId && userType && college) {
      const res = await request({ url: '/api/result/list', method: 'get', params: { userId, userType, college } })
      if (res.code === 200) {
        let filteredResults = res.data.filter(item => parseInt(item.score) > 80 && parseInt(item.incubationScore) > 80)
        if (filterStatus.value === 'pending') filteredResults = filteredResults.filter(item => item.reviewStatus === 1)
        else if (filterStatus.value === 'reviewed') filteredResults = filteredResults.filter(item => item.reviewStatus === 2)
        reviewList.value = filteredResults
      }
    }
  } catch (error) { console.error('加载评审成果失败:', error) }
}

const viewDetail = async (item) => {
  try {
    const res = await request({ url: '/api/student/info', method: 'get', params: { studentId: item.studentId } })
    if (res.code === 200) { currentDetail.value = item; currentStudent.value = res.data; showDetailDialog.value = true }
    else { alert('获取学生信息失败') }
  } catch (error) { console.error('获取学生信息失败:', error); alert('获取学生信息失败，请检查网络') }
}

const closeDetailDialog = () => { showDetailDialog.value = false; currentDetail.value = null; currentStudent.value = null }

const openReviewDialog = (item) => { currentReview.value = item; reviewForm.value = { score: '', comment: '', conclusion: '', progress: item.reviewProgress || 0 }; showReviewDialog.value = true }

const closeReviewDialog = () => { showReviewDialog.value = false; currentReview.value = null }

const submitReview = async () => {
  if (!reviewForm.value.score || !reviewForm.value.comment || !reviewForm.value.conclusion) { alert('请填写完整评审信息'); return }
  try {
    const progressRes = await request({ url: '/api/result/review-progress', method: 'post', data: { achievementId: currentReview.value.id, progress: reviewForm.value.progress } })
    if (progressRes.code === 200) { alert('评审提交成功！'); closeReviewDialog(); loadReviews() }
    else { alert('更新评审进度失败：' + (progressRes.msg || '未知错误')) }
  } catch (error) { console.error('提交评审失败:', error); alert('提交评审失败：' + (error.msg || '网络错误')) }
}

const passReview = async () => {
  if (!reviewForm.value.score) { alert('请填写评分'); return }
  try {
    const res = await request({ url: '/api/result/review-pass', method: 'post', data: { achievementId: currentReview.value.id, score: reviewForm.value.score, comment: reviewForm.value.comment } })
    if (res.code === 200) { alert('评审通过成功！'); closeReviewDialog(); loadReviews() }
    else { alert('评审通过失败：' + (res.msg || '未知错误')) }
  } catch (error) { console.error('评审通过失败:', error); alert('评审通过失败：' + (error.msg || '网络错误')) }
}

const rejectReview = async () => {
  if (!reviewForm.value.comment) { alert('请填写打回原因'); return }
  try {
    const res = await request({ url: '/api/result/review-reject', method: 'post', data: { achievementId: currentReview.value.id, reason: reviewForm.value.comment } })
    if (res.code === 200) { alert('评审打回成功！'); closeReviewDialog(); loadReviews() }
    else { alert('评审打回失败：' + (res.msg || '未知错误')) }
  } catch (error) { console.error('评审打回失败:', error); alert('评审打回失败：' + (error.msg || '网络错误')) }
}

onMounted(() => { loadReviews() })
watch(filterStatus, () => { loadReviews() })
</script>

<style scoped>
.view-content {
  max-width: var(--content-max-width-wide);
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header { margin-bottom: var(--spacing-xl); }

.filter-bar { margin-bottom: 20px; }

.filter-select {
  padding: 10px 16px; border: 1px solid var(--border-color);
  border-radius: var(--radius-md); font-size: var(--font-size-base); background-color: var(--bg-card);
}

.review-list { display: flex; flex-direction: column; gap: 20px; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg); }
.card-header h3 { margin: 0; font-size: var(--font-size-xxl); color: var(--text-primary); }

.status-badge { padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
.status-badge.not-reviewed { background-color: var(--color-danger-bg); color: var(--color-danger); }
.status-badge.pending { background-color: var(--color-warning-bg); color: var(--color-warning); }
.status-badge.reviewed { background-color: var(--color-success-bg); color: var(--color-success); }

.card-body { margin-bottom: var(--spacing-lg); }

.info-row { display: flex; margin-bottom: var(--spacing-sm); }
.label { font-size: var(--font-size-base); color: var(--text-secondary); width: 90px; }
.value { font-size: var(--font-size-base); color: var(--text-primary); }

.description { margin-top: var(--spacing-md); display: flex; }
.description .value { flex: 1; line-height: 1.6; }

.card-footer { display: flex; gap: var(--spacing-md); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color-light); }

.btn-view, .btn-review { padding: 10px 20px; border: none; border-radius: var(--radius-md); font-size: var(--font-size-base); cursor: pointer; transition: all var(--transition-base); }
.btn-view { background-color: var(--border-color-light); color: var(--text-primary); }
.btn-view:hover { background-color: #e0e2e5; }
.btn-review { background: var(--gradient-primary); color: var(--text-inverse); }
.btn-review:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43, 90, 237, 0.4); }

.achievement-info { background-color: #f9fafc; padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: 20px; }
.achievement-info h3 { margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-lg); color: var(--text-primary); }
.achievement-info p { margin: 0; font-size: var(--font-size-base); color: var(--text-secondary); line-height: 1.6; }

.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: var(--spacing-sm); font-size: var(--font-size-base); color: var(--text-primary); font-weight: 500; }
.form-group input, .form-group textarea, .form-select { width: 100%; padding: var(--spacing-md); border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: var(--font-size-base); box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus, .form-select:focus { outline: none; border-color: var(--color-primary); }

.progress-container { display: flex; align-items: center; gap: var(--spacing-lg); }
.progress-slider { flex: 1; height: 6px; -webkit-appearance: none; appearance: none; background: #e9ecef; border-radius: 3px; outline: none; }
.progress-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--gradient-primary); cursor: pointer; box-shadow: 0 2px 6px rgba(43, 90, 237, 0.3); transition: all var(--transition-base); }
.progress-slider::-webkit-slider-thumb:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(43, 90, 237, 0.5); }
.progress-value { font-size: var(--font-size-base); color: var(--color-primary); font-weight: 500; min-width: 50px; text-align: right; }

.dialog-footer { display: flex; justify-content: flex-end; gap: var(--spacing-md); }

.detail-section { margin-bottom: var(--spacing-xl); padding: 20px; background: var(--color-primary-bg-light); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
.detail-section h3 { margin: 0 0 var(--spacing-lg) 0; font-size: var(--font-size-xl); color: var(--text-primary); font-weight: 600; padding-bottom: var(--spacing-sm); border-bottom: 2px solid var(--color-primary); display: inline-block; }
.detail-row { display: flex; margin-bottom: var(--spacing-md); align-items: flex-start; }
.detail-label { font-size: var(--font-size-base); color: var(--text-secondary); font-weight: 500; width: 100px; flex-shrink: 0; padding-top: 4px; }
.detail-value { font-size: var(--font-size-base); color: var(--text-primary); flex: 1; line-height: 1.6; word-break: break-word; }
</style>
