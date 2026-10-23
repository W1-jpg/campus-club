<template>
  <PageLayout userType="student">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">我的成果</h1>
          <p class="page-hero__subtitle">管理你上传的社团成果，跟踪评分与孵化状态</p>
        </div>
        <button class="page-hero__action" @click="$router.push('/成果上传')">📤 上传新成果</button>
      </div>

      <!-- 搜索 -->
      <div class="filter-bar">
        <div class="filter-bar__search">
          <span class="filter-bar__icon">🔍</span>
          <input v-model="searchKeyword" type="text" placeholder="搜索成果名称、类型..." class="filter-bar__input" />
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="state-box">
        <div class="loading-spinner"></div>
        <p>正在加载成果数据...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="myResults.length === 0" class="state-box">
        <div class="state-box__icon">📭</div>
        <p class="state-box__title">暂无成果</p>
        <p class="state-box__hint">你还没有上传任何社团成果</p>
        <el-button type="primary" size="large" @click="$router.push('/成果上传')">去上传成果</el-button>
      </div>

      <!-- 成果列表 -->
      <div v-else class="result-list">
        <div class="result-card" v-for="item in filteredResults" :key="item.id">
          <div class="result-card__main">
            <div class="result-card__info">
              <div class="result-card__header">
                <h3 class="result-card__title">{{ item.title }}</h3>
                <span class="status-tag" :class="getStatusClass(item)">{{ getStatusText(item) }}</span>
              </div>
              <div class="result-card__meta">
                <span class="meta-item">📂 {{ item.type }}</span>
                <span class="meta-item">📅 {{ formatDate(item.createTime) }}</span>
                <span class="meta-item">👍 {{ item.likeCount || 0 }}</span>
                <span class="meta-item">💬 {{ item.comments ? item.comments.length : 0 }}</span>
              </div>
              <p class="result-card__desc" v-if="item.description">{{ item.description }}</p>
              <div v-if="String(item.reviewStatus) === '3'" class="reject-alert">
                <span class="reject-alert__icon">⚠️</span>
                <div class="reject-alert__body">
                  <b>该成果已被教师打回</b>
                  <p>{{ item.rejectReason || '请根据评审意见修改后重新提交' }}</p>
                </div>
                <el-button type="danger" plain size="small" @click="editResult(item)">修改并重新提交</el-button>
              </div>
            </div>
            <div class="result-card__actions">
              <el-button type="primary" plain size="small" @click="viewDetail(item.id)">👁️ 查看</el-button>
              <el-button v-if="String(item.reviewStatus) === '2'" type="info" plain size="small" @click="appealResult(item)">📝 申请复核</el-button>
              <el-button type="warning" plain size="small" @click="editResult(item)">✏️ 修改</el-button>
              <el-button type="danger" plain size="small" @click="deleteResult(item.id)">🗑️ 删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 修改弹窗 -->
      <el-dialog v-model="editDialogVisible" title="修改成果" width="550px" :close-on-click-modal="true">
        <el-form :model="editForm" label-width="80px" label-position="top">
          <el-form-item label="成果名称">
            <el-input v-model="editForm.title" placeholder="请输入成果名称" />
          </el-form-item>
          <el-form-item label="成果类型">
            <el-select v-model="editForm.type" placeholder="请选择类型" class="w-full">
              <el-option label="软件作品" value="软件" />
              <el-option label="学术论文" value="论文" />
              <el-option label="文创作品" value="文创" />
              <el-option label="科技发明" value="发明" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="成果描述">
            <el-input type="textarea" v-model="editForm.description" :rows="4" placeholder="请输入成果描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">保存修改</el-button>
        </template>
      </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const loading = ref(false)
const myResults = ref([])
const searchKeyword = ref('')
const editDialogVisible = ref(false)
const editForm = ref({})

const filteredResults = computed(() => {
  if (!searchKeyword.value) return myResults.value
  const kw = searchKeyword.value.toLowerCase()
  return myResults.value.filter(r =>
    (r.title || '').toLowerCase().includes(kw) ||
    (r.type || '').toLowerCase().includes(kw) ||
    (r.description || '').toLowerCase().includes(kw)
  )
})

const loadMyResults = async () => {
  try {
    loading.value = true
    const studentId = localStorage.getItem('studentId')
    const userId = studentId || localStorage.getItem('teacherId') || localStorage.getItem('adminId')
    const userType = localStorage.getItem('userType')
    if (!studentId) { ElMessage.error('请先登录'); router.push('/login/student'); return }
    const res = await request({ url: '/api/result/my', method: 'get', params: { studentId, userId, userType } })
    if (res.code === 200) myResults.value = res.data || []
    else ElMessage.error(res.msg || '获取成果失败')
  } catch (error) { ElMessage.error('获取成果失败，请检查网络') }
  finally { loading.value = false }
}

const viewDetail = (id) => router.push(`/成果详情/${id}`)

const appealResult = async (item) => {
  try {
    const { value } = await ElMessageBox.prompt('请填写申请复核的理由', '申请复核', {
      inputType: 'textarea',
      inputPlaceholder: '例如：认为评审分数与成果实际水平不符，理由如下……',
      confirmButtonText: '提交',
      cancelButtonText: '取消',
      inputValidator: (v) => (v && v.trim() ? true : '请填写复核理由')
    })
    const res = await request.post('/api/result/appeal', { achievementId: item.id, reason: value.trim() })
    if (res.code === 200) ElMessage.success('复核申请已提交')
    else ElMessage.error(res.msg || '提交失败')
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error(e.msg || '提交失败')
  }
}
const editResult = (result) => { editForm.value = { ...result }; editDialogVisible.value = true }

const submitEdit = async () => {
  try {
    const res = await request({ url: '/api/result/update', method: 'put', data: editForm.value })
    if (res.code === 200) { ElMessage.success('修改成功'); editDialogVisible.value = false; loadMyResults() }
    else ElMessage.error(res.msg || '修改失败')
  } catch (error) { ElMessage.error('修改失败，请检查网络') }
}

const deleteResult = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这个成果吗？此操作不可恢复！', '删除确认', { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' })
    const res = await request({ url: `/api/result/delete/${id}`, method: 'delete' })
    if (res.code === 200) { ElMessage.success('删除成功'); loadMyResults() }
    else ElMessage.error(res.msg || '删除失败')
  } catch (error) { if (error !== 'cancel') ElMessage.error('删除失败，请检查网络') }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const getStatusText = (r) => {
  const rs = Number(r.reviewStatus)
  if (rs === 3) return '已打回'
  if (rs === 1) return '评审中'
  if (rs === 2) return '已通过'
  if (r.incubationStatus === 1) return '孵化中'
  if (r.incubationStatus === 2) return '孵化完成'
  if (r.score) return '已评分'
  return '待评分'
}
const getStatusClass = (r) => {
  const rs = Number(r.reviewStatus)
  if (rs === 3) return 'tag-reject'
  if (rs === 1) return 'tag-reviewing'
  if (rs === 2) return 'tag-done'
  if (r.incubationStatus === 1) return 'tag-incubating'
  if (r.incubationStatus === 2) return 'tag-done'
  if (r.score) return 'tag-scored'
  return 'tag-pending'
}

onMounted(() => { loadMyResults() })
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
  display: flex; justify-content: space-between; align-items: center;
}
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-xs) 0; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; }
.page-hero__action { padding: 10px 24px; border: 2px solid rgba(255,255,255,0.5); border-radius: var(--radius-md); background: rgba(255,255,255,0.15); color: #fff; font-size: var(--font-size-base); font-weight: 600; cursor: pointer; transition: all var(--transition-base); white-space: nowrap; backdrop-filter: blur(4px); }
.page-hero__action:hover { background: rgba(255,255,255,0.25); border-color: #fff; transform: translateY(-2px); }

/* 搜索 */
.filter-bar { margin-bottom: var(--spacing-xl); }
.filter-bar__search { display: flex; align-items: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 0 var(--spacing-lg); transition: all var(--transition-fast); }
.filter-bar__search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(43,90,237,0.1); }
.filter-bar__icon { font-size: 16px; margin-right: var(--spacing-sm); flex-shrink: 0; }
.filter-bar__input { flex: 1; border: none; outline: none; padding: 12px 0; font-size: var(--font-size-base); background: transparent; color: var(--text-primary); }
.filter-bar__input::placeholder { color: var(--text-tertiary); }

/* 通用状态 */
.state-box { text-align: center; padding: 80px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.state-box__icon { font-size: 64px; margin-bottom: var(--spacing-lg); }
.state-box__title { font-size: var(--font-size-xl); font-weight: 600; color: var(--text-primary); margin: 0 0 var(--spacing-sm) 0; }
.state-box__hint { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0 0 var(--spacing-xl) 0; }
.loading-spinner { width: 40px; height: 40px; border: 3px solid var(--border-color-light); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto var(--spacing-lg); }
@keyframes spin { to { transform: rotate(360deg); } }

/* 成果卡片 */
.result-list { display: flex; flex-direction: column; gap: var(--spacing-md); }
.result-card { background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); transition: all var(--transition-base); overflow: hidden; }
.result-card:hover { box-shadow: var(--shadow-md); border-color: var(--color-primary-light); }
.result-card__main { display: flex; justify-content: space-between; align-items: flex-start; padding: var(--spacing-xl); gap: var(--spacing-xl); }
.result-card__info { flex: 1; min-width: 0; }
.result-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-lg); margin-bottom: var(--spacing-sm); }
.result-card__title { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); margin: 0; flex: 1; line-height: 1.4; }
.result-card__meta { display: flex; flex-wrap: wrap; gap: var(--spacing-lg); margin-bottom: var(--spacing-sm); }
.meta-item { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.result-card__desc { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.5; margin: 0; padding: var(--spacing-sm) var(--spacing-md); background: var(--color-primary-bg-light); border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.result-card__actions { display: flex; gap: var(--spacing-sm); flex-shrink: 0; }

/* 状态标签 */
.status-tag { padding: 3px 12px; border-radius: var(--radius-round); font-size: var(--font-size-xs); font-weight: 600; color: #fff; white-space: nowrap; flex-shrink: 0; }
.tag-pending { background: var(--color-warning); }
.tag-reject { background: var(--color-danger); }
.tag-reviewing { background: var(--color-warning); }
.reject-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff6f6;
}
.reject-alert__icon { font-size: 20px; flex-shrink: 0; }
.reject-alert__body { flex: 1; min-width: 0; }
.reject-alert__body b { display: block; color: #b91c1c; font-size: 13px; margin-bottom: 2px; }
.reject-alert__body p { margin: 0; color: #7f1d1d; font-size: 12px; line-height: 1.5; word-break: break-word; }
.tag-scored { background: var(--color-success); }
.tag-incubating { background: var(--color-primary); }
.tag-done { background: var(--text-tertiary); }

.w-full { width: 100%; }

@media (max-width: 1024px) {
  .page-hero { flex-direction: column; gap: var(--spacing-lg); text-align: center; }
}
@media (max-width: 768px) {
  .view-content { padding: var(--spacing-md); }
  .page-hero { padding: var(--spacing-lg); }
  .page-hero__title { font-size: var(--font-size-xl); }
  .result-card__main { flex-direction: column; }
  .result-card__actions { flex-direction: row; width: 100%; }
  .result-card__actions .el-button { flex: 1; }
  .result-card__header { flex-direction: column; gap: var(--spacing-sm); }
  .result-card__meta { gap: var(--spacing-md); }
}
</style>
