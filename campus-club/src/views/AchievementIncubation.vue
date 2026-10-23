<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">成果孵化</h1>
          <p class="page-hero__subtitle">管理学生成果的孵化流程，评审孵化进度与质量</p>
        </div>
      </div>

      <!-- 筛选 -->
      <div class="filter-bar">
        <el-select v-model="filterStatus" placeholder="全部状态" clearable size="default" style="width:150px">
          <el-option label="全部状态" value="" />
          <el-option label="孵化中" value="1" />
          <el-option label="孵化完成" value="2" />
        </el-select>
        <el-select v-model="filterType" placeholder="全部类型" clearable size="default" style="width:150px">
          <el-option label="全部类型" value="" />
          <el-option v-for="t in allTypes" :key="t" :label="t" :value="t" />
        </el-select>
      </div>

      <!-- 孵化列表 -->
      <div v-if="filteredList.length > 0" class="incubation-list">
        <div class="incubation-card" v-for="item in filteredList" :key="item.id">
          <div class="incubation-card__top">
            <div class="incubation-card__info">
              <h3>{{ item.title }}</h3>
              <div class="info-grid">
                <span><span class="lbl">类型</span> {{ item.type }}</span>
                <span><span class="lbl">负责人</span> {{ item.leader }}</span>
                <span><span class="lbl">申请时间</span> {{ formatTime(item.applyTime) }}</span>
              </div>
              <p class="incubation-card__desc" v-if="item.description">{{ item.description }}</p>
            </div>
            <span class="status-tag" :class="item.incubationScore ? 'tag-scored' : 'tag-pending'">
              {{ item.incubationScore ? '已评分' : '待评分' }}
            </span>
          </div>

          <!-- 进度条 -->
          <div class="incubation-card__progress" v-if="item.progress">
            <div class="progress-header">
              <span>孵化进度</span>
              <span class="progress-pct">{{ item.progress }}%</span>
            </div>
            <div class="progress-bar"><div class="progress-bar__fill" :style="{ width: item.progress + '%' }"></div></div>
          </div>

          <div class="incubation-card__footer">
            <button class="btn-view" @click="viewDetail(item)">查看详情</button>
            <button class="btn-score" v-if="!item.incubationScore" @click="scoreIncubation(item)">去评分</button>
            <span class="score-done" v-else>评分：{{ item.incubationScore }} 分</span>
          </div>
        </div>
      </div>

      <div v-else class="state-box">
        <div class="state-box__icon">📋</div>
        <p class="state-box__title">暂无孵化成果</p>
      </div>
    </div>

    <!-- 评分弹窗 -->
    <el-dialog v-model="showScoreDialog" title="孵化成果评分" width="650px" @close="closeScoreDialog">
      <div class="score-dialog" v-if="currentIncubation">
        <div class="score-dialog__info">
          <h3>{{ currentIncubation.title }}</h3>
          <p>{{ currentIncubation.description }}</p>
        </div>
        <div class="score-dialog__files" v-if="currentIncubation.achievementFiles && currentIncubation.achievementFiles.length > 0">
          <h4>成果文件（阶段二）</h4>
          <div class="file-list">
            <div v-for="(file, index) in currentIncubation.achievementFiles" :key="index" class="file-row">
              <span>📄 {{ file.name }}</span>
              <a v-if="file.url" :href="file.url" target="_blank" class="file-link">下载查看</a>
            </div>
          </div>
        </div>
        <div class="score-dialog__criteria">
          <h4>评分依据（{{ currentIncubation.type }}）</h4>
          <div class="criteria-list">
            <p v-for="(criterion, index) in getScoringCriteria(currentIncubation.type)" :key="index">
              {{ index + 1 }}. {{ criterion }}
            </p>
          </div>
        </div>
        <div class="score-dialog__form">
          <div class="form-group">
            <label>评分（0-100）</label>
            <el-input-number v-model="scoreForm.score" :min="0" :max="100" controls-position="right" class="w-full" />
          </div>
          <div class="form-group">
            <label>评语</label>
            <el-input type="textarea" v-model="scoreForm.comment" :rows="3" placeholder="请输入评语" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeScoreDialog">取消</el-button>
        <el-button type="danger" @click="rejectIncubation">打回</el-button>
        <el-button type="primary" @click="submitScore">提交评分</el-button>
      </template>
    </el-dialog>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetailDialog" title="项目详情" width="550px" @close="closeDetailDialog">
      <div class="detail-content" v-if="currentDetail">
        <div class="detail-section">
          <h3>项目信息</h3>
          <div class="detail-row"><span class="dl">项目名称</span><span class="dv">{{ currentDetail.title }}</span></div>
          <div class="detail-row"><span class="dl">项目类型</span><span class="dv">{{ currentDetail.type }}</span></div>
          <div class="detail-row"><span class="dl">上传时间</span><span class="dv">{{ formatTime(currentDetail.applyTime) }}</span></div>
          <div class="detail-row"><span class="dl">项目描述</span><span class="dv">{{ currentDetail.description }}</span></div>
          <div class="detail-row" v-if="currentDetail.progress"><span class="dl">孵化进度</span><span class="dv">{{ currentDetail.progress }}%</span></div>
          <div class="detail-row" v-if="currentDetail.incubationScore"><span class="dl">孵化评分</span><span class="dv score">{{ currentDetail.incubationScore }} 分</span></div>
        </div>
        <div class="detail-section" v-if="(currentDetail.achievementFiles && currentDetail.achievementFiles.length) || (currentDetail.clubFiles && currentDetail.clubFiles.length)">
          <h3>成果文件</h3>
          <div class="file-list">
            <div v-for="(file, index) in currentDetail.clubFiles" :key="'club-' + index" class="file-row">
              <span>📄 {{ file.name }}<small class="file-stage">阶段一</small></span>
              <a v-if="file.url" :href="file.url" target="_blank" class="file-link">下载查看</a>
            </div>
            <div v-for="(file, index) in currentDetail.achievementFiles" :key="'ach-' + index" class="file-row">
              <span>📄 {{ file.name }}<small class="file-stage">阶段二</small></span>
              <a v-if="file.url" :href="file.url" target="_blank" class="file-link">下载查看</a>
            </div>
          </div>
        </div>
        <div class="detail-section" v-if="currentStudent">
          <h3>上传者信息</h3>
          <div class="detail-row"><span class="dl">姓名</span><span class="dv">{{ currentStudent.realName }}</span></div>
          <div class="detail-row"><span class="dl">学号</span><span class="dv">{{ currentStudent.username }}</span></div>
          <div class="detail-row"><span class="dl">手机号</span><span class="dv">{{ currentStudent.phone }}</span></div>
          <div class="detail-row"><span class="dl">邮箱</span><span class="dv">{{ currentStudent.email }}</span></div>
          <div class="detail-row"><span class="dl">学院</span><span class="dv">{{ currentStudent.college }}</span></div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="closeDetailDialog">关闭</el-button>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const filterStatus = ref('')
const filterType = ref('')
const incubationList = ref([])
const showScoreDialog = ref(false)
const showDetailDialog = ref(false)
const currentIncubation = ref(null)
const currentDetail = ref(null)
const currentStudent = ref(null)
const scoreForm = ref({ score: 0, comment: '' })

const allTypes = computed(() => [...new Set(incubationList.value.map(i => i.type).filter(Boolean))])

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const getScoringCriteria = (type) => {
  const map = {
    '软件': ['功能完整性：软件功能是否完整实现需求','代码质量：代码结构清晰、注释完善','用户体验：界面设计友好、操作便捷','创新性：具有创新功能或技术突破','实用性：能够解决实际问题'],
    '论文': ['选题价值：具有学术价值和现实意义','文献综述：全面、引用规范','研究方法：科学、数据可靠','创新性：新见解或理论贡献','写作规范：结构合理、语言规范'],
    '文创': ['创意性：设计具有独特创意','文化内涵：体现文化内涵或艺术价值','实用性：具有实用价值或市场潜力','制作工艺：制作工艺精良','整体效果：视觉效果协调美观'],
    '发明': ['创新性：技术方案具有创新性','实用性：能够解决实际问题','可行性：技术实现可行','完整性：技术文档完整','应用前景：具有推广价值'],
    '实践': ['实践意义：具有社会意义','组织策划：活动策划周密','实施效果：效果达到预期','总结反思：总结深入、反思到位','影响力：活动影响力和社会效益'],
    '艺术': ['艺术表现力：作品表现力','技巧水平：表演/创作技巧娴熟','创新性：具有艺术创新','感染力：具有艺术感染力','整体效果：整体演出/作品效果'],
    '创业': ['商业模式：清晰可行','市场分析：深入','创新性：具有创新点','可行性：具备实施条件','发展潜力：发展潜力和市场前景'],
    '竞赛': ['竞赛成绩：成绩和排名','作品质量：作品质量水平','创新性：具有创新性','难度系数：竞赛难度和含金量','团队协作：团队协作表现'],
    '调查': ['选题价值：选题具有价值','调查设计：方案设计科学','数据质量：采集规范、质量可靠','分析方法：方法恰当','结论价值：结论有参考价值'],
    '其他': ['创新性：具有创新点','完成度：完成度高','实用性：具有实用价值','规范性：形式规范','整体评价：综合评价成果质量']
  }
  return map[type] || map['其他']
}

const filteredList = computed(() => {
  return incubationList.value.filter(item => {
    if (filterStatus.value && item.incubationStatus && item.incubationStatus.toString() !== filterStatus.value) return false
    if (filterType.value && item.type !== filterType.value) return false
    return true
  })
})

const loadIncubations = async () => {
  try {
    const userId = localStorage.getItem('teacherId')
    const userType = localStorage.getItem('userType')
    const college = localStorage.getItem('college')
    const res = await request({ url: '/api/result/list', method: 'get', params: { userId, userType, college } })
    if (res.code === 200) {
      incubationList.value = (res.data || [])
        .filter(item => item.achievementFiles && item.achievementFiles.length > 0 || item.incubationStatus > 0)
        .map(item => ({
          id: item.id, title: item.title, type: item.type,
          student_id: item.studentId, leader: '学生',
          applyTime: item.createTime, description: item.description,
          incubationStatus: item.incubationStatus || 1,
          progress: item.incubationStatus === 2 ? 100 : Math.floor(Math.random() * 40 + 40),
          achievementFiles: item.achievementFiles || [],
          incubationScore: item.incubationScore || null
        }))
    }
  } catch (error) { ElMessage.error('加载孵化成果失败') }
}

const viewDetail = async (item) => {
  try {
    const res = await request({ url: '/api/student/info', method: 'get', params: { studentId: item.student_id } })
    if (res.code === 200) { currentDetail.value = item; currentStudent.value = res.data; showDetailDialog.value = true }
    else ElMessage.error('获取学生信息失败')
  } catch (error) { ElMessage.error('获取学生信息失败，请检查网络') }
}

const closeDetailDialog = () => { showDetailDialog.value = false; currentDetail.value = null; currentStudent.value = null }

const scoreIncubation = (item) => { currentIncubation.value = item; scoreForm.value = { score: 0, comment: '' }; showScoreDialog.value = true }
const closeScoreDialog = () => { showScoreDialog.value = false; currentIncubation.value = null }

const submitScore = async () => {
  if (!scoreForm.value.score) { ElMessage.warning('请输入评分'); return }
  try {
    const res = await request({ url: '/api/result/incubation-score', method: 'post', params: { achievementId: currentIncubation.value.id, score: scoreForm.value.score } })
    if (res.code === 200) { ElMessage.success(res.msg || '评分提交成功'); closeScoreDialog(); loadIncubations() }
    else ElMessage.error(res.msg || '评分失败')
  } catch (error) { ElMessage.error('评分失败：' + (error.msg || '网络错误')) }
}

const rejectIncubation = async () => {
  try {
    const { value } = await ElMessageBox.prompt('请填写孵化打回原因，学生端会看到该原因', '打回孵化成果', {
      inputType: 'textarea',
      inputPlaceholder: '例如：阶段成果不完整，请补充孵化进展说明',
      confirmButtonText: '确认打回',
      cancelButtonText: '取消',
      inputValidator: (v) => (v && v.trim() ? true : '打回原因不能为空')
    })
    const res = await request({
      url: '/api/result/incubation-reject',
      method: 'post',
      params: { achievementId: currentIncubation.value.id, reason: value.trim() }
    })
    if (res.code === 200) {
      ElMessage.success('打回成功')
      closeScoreDialog()
      loadIncubations()
    } else {
      ElMessage.error(res.msg || '打回失败')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(error.msg || '打回失败')
  }
}

onMounted(() => { loadIncubations() })
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

/* 页面头部 */
.page-hero {
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-xxl);
  margin-bottom: var(--spacing-lg);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}
.page-hero__title { font-size: var(--font-size-title); font-weight: 700; margin: 0 0 2px 0; }
.page-hero__subtitle { font-size: var(--font-size-sm); opacity: 0.8; margin: 0; }

/* 筛选 */
.filter-bar { display: flex; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }

/* 孵化卡片 */
.incubation-list { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.incubation-card { background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); padding: var(--spacing-xl); transition: all var(--transition-base); }
.incubation-card:hover { box-shadow: var(--shadow-md); border-color: var(--color-primary-light); }
.incubation-card__top { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); }
.incubation-card__info { flex: 1; min-width: 0; }
.incubation-card__info h3 { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin: 0 0 var(--spacing-sm) 0; }
.info-grid { display: flex; flex-wrap: wrap; gap: var(--spacing-xl); font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-sm); }
.info-grid .lbl { color: var(--text-tertiary); margin-right: 4px; }
.incubation-card__desc { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; margin: var(--spacing-sm) 0 0 0; padding: var(--spacing-sm) var(--spacing-md); background: var(--color-primary-bg-light); border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); }

.status-tag { padding: 3px 12px; border-radius: var(--radius-round); font-size: var(--font-size-xs); font-weight: 600; white-space: nowrap; flex-shrink: 0; }
.tag-pending { background: var(--color-warning-bg); color: var(--color-warning); }
.tag-scored { background: var(--color-success-bg); color: var(--color-success); }

.incubation-card__progress { padding: var(--spacing-md); background: var(--color-primary-bg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg); }
.progress-header { display: flex; justify-content: space-between; font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-sm); }
.progress-pct { color: var(--color-primary); }
.progress-bar { height: 8px; background: rgba(0,0,0,0.06); border-radius: 4px; overflow: hidden; }
.progress-bar__fill { height: 100%; background: var(--gradient-primary); border-radius: 4px; transition: width 0.6s ease; }

.incubation-card__footer { display: flex; align-items: center; gap: var(--spacing-md); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color-light); }
.btn-view, .btn-score { padding: 8px 20px; border: none; border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; transition: all var(--transition-base); }
.btn-view { background: var(--border-color-light); color: var(--text-primary); }
.btn-view:hover { background: #dde0e4; }
.btn-score { background: var(--gradient-primary); color: #fff; }
.btn-score:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43,90,237,0.4); }
.score-done { font-size: var(--font-size-base); color: var(--color-success); font-weight: 700; }

/* 评分弹窗 */
.score-dialog__info { padding: var(--spacing-lg); background: var(--color-primary-bg-light); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg); border: 1px solid var(--border-color); }
.score-dialog__info h3 { margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-xl); }
.score-dialog__info p { margin: 0; font-size: var(--font-size-sm); color: var(--text-secondary); }
.score-dialog__files { margin-bottom: var(--spacing-lg); }
.score-dialog__files h4 { font-size: var(--font-size-base); font-weight: 600; margin-bottom: var(--spacing-sm); }
.file-list { background: #f9fafc; border-radius: var(--radius-md); padding: var(--spacing-sm) var(--spacing-md); border: 1px solid var(--border-color); }
.file-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; font-size: var(--font-size-sm); border-bottom: 1px solid var(--border-color); }
.file-row:last-child { border-bottom: none; }
.file-link { color: var(--color-primary); font-size: var(--font-size-xs); padding: 2px 10px; background: var(--color-primary-bg); border-radius: var(--radius-sm); text-decoration: none; }
.file-link:hover { background: var(--color-primary); color: #fff; }
.file-stage { margin-left: 8px; padding: 1px 6px; border-radius: 6px; background: var(--color-primary-bg); color: var(--color-primary); font-size: 10px; }
.score-dialog__criteria { background: var(--color-primary-bg-light); border-radius: var(--radius-md); padding: var(--spacing-lg); margin-bottom: var(--spacing-lg); border-left: 4px solid var(--color-primary); }
.score-dialog__criteria h4 { font-size: var(--font-size-base); font-weight: 600; margin-bottom: var(--spacing-sm); }
.criteria-list p { font-size: var(--font-size-sm); color: var(--text-secondary); margin: 0 0 4px 0; line-height: 1.6; }
.score-dialog__form { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.form-group label { display: block; font-size: var(--font-size-sm); font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-xs); }
.w-full { width: 100%; }

/* 详情弹窗 */
.detail-content { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.detail-section { padding: var(--spacing-lg); background: var(--color-primary-bg-light); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
.detail-section h3 { margin: 0 0 var(--spacing-md) 0; font-size: var(--font-size-lg); font-weight: 700; padding-bottom: var(--spacing-sm); border-bottom: 2px solid var(--color-primary); display: inline-block; }
.detail-row { display: flex; margin-bottom: var(--spacing-sm); }
.dl { font-size: var(--font-size-sm); color: var(--text-secondary); width: 80px; flex-shrink: 0; font-weight: 500; }
.dv { font-size: var(--font-size-sm); color: var(--text-primary); flex: 1; line-height: 1.6; }
.dv.score { color: var(--color-primary); font-weight: 700; font-size: var(--font-size-lg); }

/* 空状态 */
.state-box { text-align: center; padding: 80px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.state-box__icon { font-size: 64px; margin-bottom: var(--spacing-lg); }
.state-box__title { font-size: var(--font-size-xl); font-weight: 600; color: var(--text-primary); margin: 0; }

@media (max-width: 768px) {
  .incubation-card__top { flex-direction: column; }
  .info-grid { flex-direction: column; gap: var(--spacing-xs); }
  .incubation-card__footer { flex-wrap: wrap; }
  .detail-row { flex-direction: column; }
}
</style>
