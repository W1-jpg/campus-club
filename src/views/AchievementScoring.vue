<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-header">
        <h1 class="page-header__title">成果评分</h1>
      </div>

      <div class="filter-bar">
        <select v-model="filterStatus" class="filter-select">
          <option value="">全部状态</option>
          <option value="pending">待评分</option>
          <option value="scored">已评分</option>
          <option value="rejected">已打回</option>
        </select>
        <select v-model="filterType" class="filter-select">
          <option value="">全部类型</option>
          <option value="软件">软件</option>
          <option value="论文">学术论文</option>
          <option value="文创">文创作品</option>
          <option value="发明">科技发明</option>
          <option value="实践">社会实践</option>
          <option value="艺术">艺术作品</option>
          <option value="创业">创业项目</option>
          <option value="竞赛">竞赛成果</option>
          <option value="调查">调查报告</option>
          <option value="其他">其他</option>
        </select>
      </div>

      <div class="achievement-list">
        <div class="content-card" v-for="item in filteredList" :key="item.id">
          <div class="card-header">
            <h3>{{ item.title }}</h3>
            <span class="status-badge" :class="item.status">{{ getStatusText(item.status) }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">类型：</span>
              <span class="value">{{ item.type }}</span>
            </div>
            <div class="info-row">
              <span class="label">提交学生：</span>
              <span class="value">{{ item.studentName }}</span>
            </div>
            <div class="info-row">
              <span class="label">提交时间：</span>
              <span class="value">{{ formatTime(item.createTime) }}</span>
            </div>
            <div class="description">
              <span class="label">描述：</span>
              <span class="value">{{ item.description }}</span>
            </div>
            <div class="score-section" v-if="item.score">
              <span class="label">评分：</span>
              <span class="score-value">{{ item.score }}分</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-view" @click="viewDetail(item)">查看详情</button>
            <button class="btn-score" v-if="item.status === 'pending'" @click="openScoreDialog(item)">评分</button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showScoreDialog" title="成果评分" width="600px" @close="closeScoreDialog">
      <div class="achievement-info">
        <h3>{{ currentAchievement?.title }}</h3>
        <p>{{ currentAchievement?.description }}</p>
      </div>

      <div class="club-files-section" v-if="currentAchievement?.clubFiles && currentAchievement.clubFiles.length > 0">
        <h4>社团文件（阶段一）</h4>
        <div class="file-list">
          <div v-for="(file, index) in currentAchievement.clubFiles" :key="index" class="file-item">
            <i class="el-icon-document"></i>
            <span>{{ file.name }}</span>
            <a :href="file.url" target="_blank" class="file-link">下载查看</a>
          </div>
        </div>
      </div>

      <div class="scoring-criteria">
        <h4>评分依据（{{ currentAchievement?.type }}）</h4>
        <div class="criteria-content">
          <p v-for="(criterion, index) in getScoringCriteria(currentAchievement?.type)" :key="index">
            {{ index + 1 }}. {{ criterion }}
          </p>
        </div>
      </div>

      <div class="form-group">
        <label>评分（0-100）</label>
        <input type="number" v-model="scoreForm.score" min="0" max="100" placeholder="请输入评分" />
      </div>
      <div class="form-group">
        <label>评语</label>
        <textarea v-model="scoreForm.comment" placeholder="请输入评语" rows="4"></textarea>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeScoreDialog">取消</el-button>
          <el-button type="danger" @click="rejectAchievement">打回</el-button>
          <el-button type="primary" @click="submitScore">提交评分</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="项目详情" width="600px" @close="closeDetailDialog">
      <div class="detail-section">
        <h3>项目信息</h3>
        <div class="detail-row">
          <span class="detail-label">项目名称：</span>
          <span class="detail-value">{{ currentDetail?.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">项目类型：</span>
          <span class="detail-value">{{ currentDetail?.type }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">上传时间：</span>
          <span class="detail-value">{{ formatTime(currentDetail?.createTime) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">项目描述：</span>
          <span class="detail-value">{{ currentDetail?.description }}</span>
        </div>
        <div class="detail-row" v-if="currentDetail?.score">
          <span class="detail-label">评分：</span>
          <span class="detail-value">{{ currentDetail?.score }}分</span>
        </div>
      </div>

      <div class="detail-section" v-if="currentStudent">
        <h3>上传者信息</h3>
        <div class="detail-row">
          <span class="detail-label">姓名：</span>
          <span class="detail-value">{{ currentStudent.realName }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">学号：</span>
          <span class="detail-value">{{ currentStudent.username }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">手机号：</span>
          <span class="detail-value">{{ currentStudent.phone }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">邮箱：</span>
          <span class="detail-value">{{ currentStudent.email }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">学院：</span>
          <span class="detail-value">{{ currentStudent.college }}</span>
        </div>
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
import { ref, onMounted, computed } from 'vue'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const filterStatus = ref('')
const filterType = ref('')
const achievementList = ref([])
const showScoreDialog = ref(false)
const showDetailDialog = ref(false)
const currentAchievement = ref(null)
const currentDetail = ref(null)
const currentStudent = ref(null)
const scoreForm = ref({
  score: '',
  comment: ''
})

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const getStatusText = (status) => {
  const map = {
    pending: '待评分',
    scored: '已评分',
    rejected: '已打回'
  }
  return map[status] || status
}

const getScoringCriteria = (type) => {
  const criteriaMap = {
    '软件': ['功能完整性：软件功能是否完整实现需求','代码质量：代码结构是否清晰，注释是否完善','用户体验：界面设计是否友好，操作是否便捷','创新性：是否具有创新功能或技术突破','实用性：是否能够解决实际问题'],
    '论文': ['选题价值：选题是否具有学术价值和现实意义','文献综述：文献综述是否全面，引用是否规范','研究方法：研究方法是否科学，数据是否可靠','创新性：是否具有新的见解或理论贡献','写作规范：论文结构是否合理，语言是否规范'],
    '文创': ['创意性：设计是否具有独特创意','文化内涵：是否体现文化内涵或艺术价值','实用性：是否具有实用价值或市场潜力','制作工艺：制作工艺是否精良','整体效果：整体视觉效果是否协调美观'],
    '发明': ['创新性：技术方案是否具有创新性','实用性：是否能够解决实际问题','可行性：技术实现是否可行','完整性：技术文档是否完整','应用前景：是否具有推广应用价值'],
    '实践': ['实践意义：实践活动是否具有社会意义','组织策划：活动策划是否周密','实施效果：实践效果是否达到预期','总结反思：总结是否深入，反思是否到位','影响力：活动影响力和社会效益'],
    '艺术': ['艺术表现力：作品艺术表现力如何','技巧水平：表演或创作技巧是否娴熟','创新性：是否具有艺术创新','感染力：是否具有艺术感染力','整体效果：整体演出或作品效果如何'],
    '创业': ['商业模式：商业模式是否清晰可行','市场分析：市场分析是否深入','创新性：是否具有创新点','可行性：项目是否具备实施条件','发展潜力：项目发展潜力和市场前景'],
    '竞赛': ['竞赛成绩：在竞赛中的成绩和排名','作品质量：参赛作品的质量水平','创新性：作品是否具有创新性','难度系数：竞赛的难度和含金量','团队协作：团队协作表现如何'],
    '调查': ['选题价值：调查选题是否具有价值','调查设计：调查方案设计是否科学','数据质量：数据采集是否规范，质量是否可靠','分析方法：分析方法是否恰当','结论价值：调查结论是否有参考价值'],
    '其他': ['创新性：是否具有创新点','完成度：成果完成度如何','实用性：是否具有实用价值','规范性：成果形式是否规范','整体评价：综合评价成果质量']
  }
  return criteriaMap[type] || criteriaMap['其他']
}

const filteredList = computed(() => {
  return achievementList.value.filter(item => {
    const statusMatch = !filterStatus.value || item.status === filterStatus.value
    const typeMatch = !filterType.value || item.type === filterType.value
    return statusMatch && typeMatch
  })
})

const loadAchievements = async () => {
  try {
    const userId = localStorage.getItem('teacherId')
    const userType = localStorage.getItem('userType')
    const college = localStorage.getItem('college')
    const res = await request({
      url: '/api/result/list',
      method: 'get',
      params: { userId, userType, college }
    })
    if (res.code === 200) {
      achievementList.value = res.data.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        student_id: item.student_id,
        studentName: item.studentName || '学生',
        createTime: item.createTime,
        description: item.description,
        status: item.status === 2 ? 'rejected' : (item.score ? 'scored' : 'pending'),
        score: item.score,
        clubFiles: item.clubFiles || []
      }))
    }
  } catch (error) {
    console.error('加载成果失败:', error)
  }
}

const viewDetail = async (item) => {
  try {
    const res = await request({
      url: '/api/student/info',
      method: 'get',
      params: { studentId: item.student_id }
    })
    if (res.code === 200) {
      const student = res.data
      currentDetail.value = item
      currentStudent.value = student
      showDetailDialog.value = true
    } else {
      alert('获取学生信息失败')
    }
  } catch (error) {
    console.error('获取学生信息失败:', error)
    alert('获取学生信息失败，请检查网络')
  }
}

const closeDetailDialog = () => {
  showDetailDialog.value = false
  currentDetail.value = null
  currentStudent.value = null
}

const openScoreDialog = (item) => {
  currentAchievement.value = item
  scoreForm.value = { score: '', comment: '' }
  showScoreDialog.value = true
}

const closeScoreDialog = () => {
  showScoreDialog.value = false
  currentAchievement.value = null
}

const submitScore = async () => {
  if (!scoreForm.value.score) {
    alert('请输入评分')
    return
  }
  try {
    const score = parseInt(scoreForm.value.score)
    const res = await request({
      url: '/api/result/score',
      method: 'post',
      params: { achievementId: currentAchievement.value.id, score: score }
    })
    if (res.code === 200) {
      if (score > 80) {
        alert('评分提交成功！该成果已自动进入孵化流程。')
      } else {
        alert('评分提交成功！')
      }
      closeScoreDialog()
      loadAchievements()
    } else {
      alert(res.msg || '评分失败')
    }
  } catch (error) {
    console.error('评分失败:', error)
    alert('评分失败：' + (error.msg || '网络错误'))
  }
}

const rejectAchievement = async () => {
  if (!scoreForm.value.comment) {
    alert('请输入打回原因')
    return
  }
  try {
    const res = await request({
      url: '/api/result/reject',
      method: 'post',
      params: { achievementId: currentAchievement.value.id, reason: scoreForm.value.comment }
    })
    if (res.code === 200) {
      alert('打回成功！')
      closeScoreDialog()
      loadAchievements()
    } else {
      alert(res.msg || '打回失败')
    }
  } catch (error) {
    console.error('打回失败:', error)
    alert('打回失败：' + (error.msg || '网络错误'))
  }
}

onMounted(() => {
  loadAchievements()
})
</script>

<style scoped>
.view-content {
  max-width: var(--content-max-width-wide);
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  margin-bottom: var(--spacing-xl);
}

.filter-bar {
  margin-bottom: 20px;
  display: flex;
  gap: var(--spacing-lg);
}

.filter-select {
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  background-color: var(--bg-card);
  min-width: 120px;
}

.achievement-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.card-header h3 {
  margin: 0;
  font-size: var(--font-size-xxl);
  color: var(--text-primary);
}

.status-badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

.status-badge.pending {
  background-color: var(--color-warning-bg);
  color: var(--color-warning);
}

.status-badge.scored {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.status-badge.rejected {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
}

.card-body { margin-bottom: var(--spacing-lg); }

.info-row {
  display: flex;
  margin-bottom: var(--spacing-sm);
}

.label {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  width: 80px;
}

.value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
}

.description {
  margin-top: var(--spacing-md);
  display: flex;
}

.description .value {
  flex: 1;
  line-height: 1.6;
}

.score-section {
  margin-top: var(--spacing-md);
  display: flex;
  align-items: center;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-primary);
}

.card-footer {
  display: flex;
  gap: var(--spacing-md);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color-light);
}

.btn-view, .btn-score {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-view {
  background-color: var(--border-color-light);
  color: var(--text-primary);
}

.btn-view:hover { background-color: #e0e2e5; }

.btn-score {
  background: var(--gradient-primary);
  color: var(--text-inverse);
}

.btn-score:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(43, 90, 237, 0.4);
}

.achievement-info {
  background: var(--color-primary-bg-light);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--border-color);
}

.achievement-info h3 {
  margin: 0 0 10px 0;
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  font-weight: 600;
}

.achievement-info p {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: 1.6;
}

.club-files-section { margin-bottom: var(--spacing-lg); }

.club-files-section h4 {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  margin-bottom: 10px;
  font-weight: 600;
}

.file-list {
  background-color: #f9fafc;
  border-radius: var(--radius-md);
  padding: 10px 12px;
  border: 1px solid var(--border-color);
}

.file-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--border-color);
}

.file-item:last-child { border-bottom: none; }

.file-item i { color: var(--color-primary); margin-right: var(--spacing-sm); font-size: var(--font-size-lg); }

.file-item span {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) 10px;
  background-color: var(--color-primary-bg);
  border-radius: var(--radius-sm);
  transition: all var(--transition-base);
}

.file-link:hover {
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

.scoring-criteria {
  background: var(--color-primary-bg-light);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: 20px;
  border-left: 4px solid var(--color-primary);
}

.scoring-criteria h4 {
  font-size: 15px;
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

.criteria-content { display: flex; flex-direction: column; gap: var(--spacing-sm); }

.criteria-content p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  padding-left: var(--spacing-sm);
}

.form-group { margin-bottom: 20px; }

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 600;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  box-sizing: border-box;
  transition: all var(--transition-base);
  background-color: var(--bg-card);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(43, 90, 237, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}

.detail-section {
  margin-bottom: var(--spacing-xl);
  padding: 20px;
  background: var(--color-primary-bg-light);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.detail-section h3 {
  margin: 0 0 var(--spacing-lg) 0;
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  font-weight: 600;
  padding-bottom: var(--spacing-sm);
  border-bottom: 2px solid var(--color-primary);
  display: inline-block;
}

.detail-row {
  display: flex;
  margin-bottom: var(--spacing-md);
  align-items: flex-start;
}

.detail-label {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  font-weight: 500;
  width: 100px;
  flex-shrink: 0;
  padding-top: 4px;
}

.detail-value {
  font-size: var(--font-size-base);
  color: var(--text-primary);
  flex: 1;
  line-height: 1.6;
  word-break: break-word;
}
</style>
