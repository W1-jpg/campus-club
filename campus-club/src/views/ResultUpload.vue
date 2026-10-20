<template>
  <PageLayout userType="student">
    <div class="view-content">
      <!-- 紧凑页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <div>
            <h1 class="page-hero__title">成果上传</h1>
            <p class="page-hero__subtitle">分享你的社团成果，展示才华与创新</p>
          </div>
          <div class="page-hero__steps">
            <span class="hs active">1. 填写信息</span>
            <span class="hs-arrow">→</span>
            <span class="hs active">2. 上传文件</span>
            <span class="hs-arrow">→</span>
            <span class="hs">3. 提交审核</span>
          </div>
        </div>
      </div>

      <!-- 表单 -->
      <el-card class="upload-form-card" shadow="never">
        <el-form :model="form" ref="formRef" label-position="top">
          <!-- 基本信息 + 两段上传 三栏并排 -->
          <div class="form-layout">
            <!-- 左栏：基本信息 -->
            <div class="form-col">
              <div class="form-col__header">
                <span class="form-col__icon">📝</span>
                <h3>基本信息</h3>
              </div>
              <el-form-item label="成果名称" prop="title">
                <el-input v-model="form.title" placeholder="给你的成果起一个响亮的名字" />
              </el-form-item>
              <el-form-item label="成果类型" prop="type">
                <el-select v-model="form.type" placeholder="请选择类型" class="w-full" @change="handleTypeChange">
                  <el-option v-for="opt in typeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="所属社团">
                <el-input v-model="form.community" placeholder="可选，填写所属社团名称" />
              </el-form-item>
              <el-form-item label="成果描述" prop="description">
                <el-input type="textarea" v-model="form.description" :rows="5" placeholder="请详细描述你的成果内容、创新点和价值..." />
              </el-form-item>
            </div>

            <!-- 中栏：社团文件 -->
            <div class="form-col">
              <div class="form-col__header">
                <span class="form-col__icon">📋</span>
                <h3>社团文件</h3>
              </div>
              <p class="form-col__desc">{{ clubFilesDesc }}</p>
              <el-upload action="#" :auto-upload="false" :on-change="handleClubFileChange" :on-remove="handleClubFileRemove" :file-list="clubFileList" multiple accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.png,.jpeg" drag class="compact-upload">
                <div class="upload-drag-area">
                  <span class="upload-drag-icon">📁</span>
                  <p class="upload-drag-text">点击或拖拽上传</p>
                  <p class="upload-drag-hint">PDF/DOC/ZIP/JPG/PNG，≤10MB</p>
                </div>
              </el-upload>
              <div v-if="form.clubFiles.length > 0" class="file-list">
                <div v-for="(file, index) in form.clubFiles" :key="'c'+index" class="file-item">
                  <span class="file-item__icon">📄</span>
                  <span class="file-item__name">{{ file.name }}</span>
                  <button class="file-item__remove" @click="removeClubFile(index)">✕</button>
                </div>
              </div>
            </div>

            <!-- 右栏：成果文件 -->
            <div class="form-col">
              <div class="form-col__header">
                <span class="form-col__icon">🏆</span>
                <h3>成果文件</h3>
              </div>
              <p class="form-col__desc">{{ achievementFilesDesc }}</p>
              <el-upload action="#" :auto-upload="false" :on-change="handleAchievementFileChange" :on-remove="handleAchievementFileRemove" :file-list="achievementFileList" multiple accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.png,.jpeg" drag class="compact-upload">
                <div class="upload-drag-area">
                  <span class="upload-drag-icon">📁</span>
                  <p class="upload-drag-text">点击或拖拽上传</p>
                  <p class="upload-drag-hint">PDF/DOC/ZIP/JPG/PNG，≤10MB</p>
                </div>
              </el-upload>
              <div v-if="form.achievementFiles.length > 0" class="file-list">
                <div v-for="(file, index) in form.achievementFiles" :key="'a'+index" class="file-item">
                  <span class="file-item__icon">📄</span>
                  <span class="file-item__name">{{ file.name }}</span>
                  <button class="file-item__remove" @click="removeAchievementFile(index)">✕</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <el-button type="primary" size="large" @click="submitForm" :loading="submitting">🚀 提交上传</el-button>
            <el-button size="large" @click="resetForm">🔄 重置表单</el-button>
          </div>
        </el-form>
      </el-card>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const form = reactive({ title: '', type: '', description: '', community: '', clubFiles: [], achievementFiles: [] })
const clubFileList = ref([])
const achievementFileList = ref([])

const typeOptions = [
  { label: '软件作品', value: '软件' }, { label: '学术论文', value: '论文' },
  { label: '文创作品', value: '文创' }, { label: '科技发明', value: '发明' },
  { label: '社会实践', value: '实践' }, { label: '艺术作品', value: '艺术' },
  { label: '创业项目', value: '创业' }, { label: '竞赛成果', value: '竞赛' },
  { label: '调查报告', value: '调查' }, { label: '其他', value: '其他' }
]

const clubFilesDesc = computed(() => {
  const map = { '软件':'社团软件项目相关文档（需求分析、设计文档等）', '论文':'社团学术活动相关资料（会议记录、研究计划等）', '文创':'社团文创活动相关资料（活动策划、宣传材料等）', '发明':'社团科技活动相关资料（实验记录、研究报告等）', '实践':'社团社会实践活动相关资料（活动策划、实践报告等）', '艺术':'社团艺术活动相关资料（活动策划、节目单等）', '创业':'社团创业活动相关资料（商业计划、市场调研等）', '竞赛':'社团竞赛活动相关资料（竞赛规则、参赛材料等）', '调查':'社团调查活动相关资料（调查问卷、调查计划等）' }
  return map[form.type] || '社团相关文件（活动记录、成员名单等）'
})
const achievementFilesDesc = computed(() => {
  const map = { '软件':'软件作品文件（源代码、安装包、使用说明等）', '论文':'学术论文文件（论文全文、参考文献等）', '文创':'文创作品文件（设计稿、成品图片、创意说明等）', '发明':'科技发明文件（发明说明书、专利材料、原型图片等）', '实践':'社会实践文件（实践报告、活动照片、成果证明等）', '艺术':'艺术作品文件（作品图片、创作说明、演出视频等）', '创业':'创业项目文件（商业计划书、财务分析、项目演示等）', '竞赛':'竞赛成果文件（竞赛作品、获奖证书、比赛照片等）', '调查':'调查报告文件（报告全文、数据图表、分析报告等）' }
  return map[form.type] || '成果相关文件（成果说明、成果图片等）'
})

const handleTypeChange = () => {
  form.clubFiles = []; form.achievementFiles = []
  clubFileList.value = []; achievementFileList.value = []
}

const handleClubFileChange = (file) => { if (!form.clubFiles.find(f => f.name === file.name)) { form.clubFiles.push(file.raw); clubFileList.value.push(file) } }
const handleClubFileRemove = (file) => { form.clubFiles = form.clubFiles.filter(f => f.name !== file.name); clubFileList.value = clubFileList.value.filter(f => f.name !== file.name) }
const removeClubFile = (index) => { form.clubFiles.splice(index, 1); clubFileList.value.splice(index, 1) }

const handleAchievementFileChange = (file) => { if (!form.achievementFiles.find(f => f.name === file.name)) { form.achievementFiles.push(file.raw); achievementFileList.value.push(file) } }
const handleAchievementFileRemove = (file) => { form.achievementFiles = form.achievementFiles.filter(f => f.name !== file.name); achievementFileList.value = achievementFileList.value.filter(f => f.name !== file.name) }
const removeAchievementFile = (index) => { form.achievementFiles.splice(index, 1); achievementFileList.value.splice(index, 1) }

const submitForm = async () => {
  if (!form.title || !form.type || !form.description || form.clubFiles.length === 0 || form.achievementFiles.length === 0) {
    ElMessage.warning('请完整填写所有必填字段并上传文件'); return
  }
  if (!localStorage.getItem('token')) { ElMessage.error('请先登录'); router.push('/login/student'); return }
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('title', form.title); formData.append('type', form.type)
    formData.append('description', form.description); formData.append('community', form.community || '')
    form.clubFiles.forEach(file => formData.append('clubFiles', file))
    form.achievementFiles.forEach(file => formData.append('achievementFiles', file))
    // 通过统一的 axios 实例走 Vite 代理，自动携带 JWT；学生身份由服务端从令牌解析
    const data = await request.post('/api/result/upload', formData)
    if (data.code === 200) { ElMessage.success('上传成功！'); router.push('/成果市场') }
    else ElMessage.error(data.msg || '上传失败')
  } catch (err) { ElMessage.error(err.msg || '上传失败，请检查网络连接') }
  finally { submitting.value = false }
}

const resetForm = () => { formRef.value?.resetFields(); form.clubFiles = []; form.achievementFiles = []; clubFileList.value = []; achievementFileList.value = [] }
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

/* 紧凑头部 */
.page-hero {
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-xxl);
  margin-bottom: var(--spacing-lg);
  color: var(--text-inverse);
  box-shadow: var(--shadow-md);
}
.page-hero__inner { display: flex; justify-content: space-between; align-items: center; }
.page-hero__title { font-size: var(--font-size-title); font-weight: 700; margin: 0 0 2px 0; }
.page-hero__subtitle { font-size: var(--font-size-sm); opacity: 0.8; margin: 0; }
.page-hero__steps { display: flex; align-items: center; gap: var(--spacing-sm); font-size: var(--font-size-xs); opacity: 0.85; flex-shrink: 0; }
.hs { opacity: 0.6; }
.hs.active { opacity: 1; font-weight: 600; }
.hs-arrow { opacity: 0.4; margin: 0 2px; }

/* 表单卡片 */
.upload-form-card { border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); }

/* 三栏布局 */
.form-layout {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
}
.form-col__header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); padding-bottom: var(--spacing-sm); border-bottom: 2px solid var(--border-color-light); }
.form-col__icon { font-size: 18px; }
.form-col__header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--text-primary); margin: 0; }
.form-col__desc { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0 0 var(--spacing-md) 0; padding: var(--spacing-sm) var(--spacing-md); background: var(--color-primary-bg-light); border-radius: var(--radius-sm); border-left: 3px solid var(--color-primary); line-height: 1.5; }

.w-full { width: 100%; }

/* 紧凑拖拽区 */
.compact-upload :deep(.el-upload-dragger) { padding: var(--spacing-lg) !important; }
.upload-drag-area { text-align: center; }
.upload-drag-icon { font-size: 32px; display: block; margin-bottom: 4px; }
.upload-drag-text { font-size: var(--font-size-sm); color: var(--text-primary); margin: 0 0 2px 0; }
.upload-drag-hint { font-size: 11px; color: var(--text-tertiary); margin: 0; }

/* 文件列表 */
.file-list { margin-top: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-xs); max-height: 180px; overflow-y: auto; }
.file-item { display: flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-sm); background: var(--bg-page); border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
.file-item__icon { font-size: 14px; flex-shrink: 0; }
.file-item__name { flex: 1; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-item__remove { width: 20px; height: 20px; border: none; border-radius: 50%; background: transparent; color: var(--text-tertiary); cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all var(--transition-fast); }
.file-item__remove:hover { background: var(--color-danger-bg); color: var(--color-danger); }

/* 操作按钮 */
.form-actions { display: flex; justify-content: center; gap: var(--spacing-lg); padding: var(--spacing-lg) var(--spacing-xl); border-top: 1px solid var(--border-color-light); background: var(--bg-page); border-radius: 0 0 var(--radius-xl) var(--radius-xl); }

@media (max-width: 1100px) {
  .form-layout { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 768px) {
  .form-layout { grid-template-columns: 1fr; }
  .page-hero__inner { flex-direction: column; align-items: flex-start; gap: var(--spacing-sm); }
  .page-hero__steps { font-size: 11px; }
  .form-actions { flex-direction: column; }
  .form-actions .el-button { width: 100%; }
}
</style>
