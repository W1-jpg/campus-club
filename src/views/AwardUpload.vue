<template>
  <PageLayout userType="student">
    <div class="view-content">
      <!-- 紧凑头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <div>
            <h1 class="page-hero__title">获奖上传</h1>
            <p class="page-hero__subtitle">上传获奖证书与相关材料，记录荣誉时刻</p>
          </div>
          <div class="page-hero__steps">
            <span class="hs active">1. 填写信息</span>
            <span class="hs-arrow">→</span>
            <span class="hs active">2. 上传材料</span>
            <span class="hs-arrow">→</span>
            <span class="hs">3. 提交审核</span>
          </div>
        </div>
      </div>

      <!-- 表单 -->
      <el-card class="upload-form-card" shadow="never">
        <el-form :model="form" ref="formRef" label-position="top">
          <div class="form-layout">
            <!-- 左栏：获奖信息 -->
            <div class="form-col">
              <div class="form-col__header">
                <span class="form-col__icon">🏆</span>
                <h3>获奖信息</h3>
              </div>
              <el-form-item label="奖项名称" prop="title">
                <el-input v-model="form.title" placeholder="如：全国大学生创新创业大赛一等奖" />
              </el-form-item>
              <el-form-item label="获奖等级" prop="level">
                <el-select v-model="form.level" placeholder="请选择获奖等级" class="w-full">
                  <el-option v-for="opt in levelOptions" :key="opt.value" :label="opt.icon + ' ' + opt.label" :value="opt.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="获奖时间" prop="awardTime">
                <el-date-picker v-model="form.awardTime" type="date" placeholder="选择日期" class="w-full" value-format="YYYY-MM-DD" />
              </el-form-item>
              <el-form-item label="获奖描述" prop="description">
                <el-input type="textarea" v-model="form.description" :rows="4" placeholder="请详细描述获奖情况，包括比赛名称、主办方、参赛项目等..." />
              </el-form-item>
            </div>

            <!-- 右栏：获奖材料 -->
            <div class="form-col form-col--wide">
              <div class="form-col__header">
                <span class="form-col__icon">📁</span>
                <h3>获奖材料</h3>
              </div>
              <p class="form-col__desc">请上传获奖证书、奖状照片、参赛证明等相关材料文件</p>
              <el-upload action="#" :auto-upload="false" :on-change="handleFileChange" :on-remove="handleFileRemove" :file-list="fileList" multiple accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.png,.jpeg" drag class="compact-upload">
                <div class="upload-drag-area">
                  <span class="upload-drag-icon">📁</span>
                  <p class="upload-drag-text">点击或拖拽文件上传</p>
                  <p class="upload-drag-hint">PDF/DOC/ZIP/JPG/PNG，≤10MB</p>
                </div>
              </el-upload>
              <div v-if="form.awardFiles.length > 0" class="file-list">
                <div v-for="(file, index) in form.awardFiles" :key="index" class="file-item">
                  <span class="file-item__icon">📄</span>
                  <span class="file-item__name">{{ file.name }}</span>
                  <button class="file-item__remove" @click="removeFile(index)">✕</button>
                </div>
              </div>
            </div>
          </div>

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
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const formRef = ref()
const submitting = ref(false)
const form = reactive({ title: '', level: '', awardTime: '', description: '', awardFiles: [] })
const fileList = ref([])

const levelOptions = [
  { label: '国家级', value: '国家级', icon: '🇨🇳' },
  { label: '省级', value: '省级', icon: '🏛️' },
  { label: '市级', value: '市级', icon: '🏙️' },
  { label: '校级', value: '校级', icon: '🏫' },
  { label: '院级', value: '院级', icon: '📚' },
]

const handleFileChange = (file) => { if (!form.awardFiles.find(f => f.name === file.name)) { form.awardFiles.push(file.raw); fileList.value.push(file) } }
const handleFileRemove = (file) => { form.awardFiles = form.awardFiles.filter(f => f.name !== file.name); fileList.value = fileList.value.filter(f => f.name !== file.name) }
const removeFile = (index) => { form.awardFiles.splice(index, 1); fileList.value.splice(index, 1) }

const submitForm = async () => {
  if (!form.title || !form.level || !form.awardTime || form.awardFiles.length === 0) {
    ElMessage.warning('请填写奖项名称、等级、时间并上传文件'); return
  }
  const studentId = localStorage.getItem('studentId')
  if (!studentId) { ElMessage.error('请先登录'); router.push('/login/student'); return }
  const college = localStorage.getItem('college')
  if (!college) { ElMessage.error('无法获取学院信息，请重新登录'); router.push('/login/student'); return }
  submitting.value = true
  try {
    const formData = new FormData()
    formData.append('title', form.title); formData.append('level', form.level)
    formData.append('awardTime', form.awardTime); formData.append('description', form.description)
    formData.append('studentId', studentId); formData.append('college', college)
    form.awardFiles.forEach(file => formData.append('awardFiles', file))
    const data = await request({ url: '/api/award/upload', method: 'post', data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
    if (data.code === 200) { ElMessage.success('获奖材料上传成功！'); resetForm() }
    else ElMessage.error(data.msg || '上传失败')
  } catch (err) { ElMessage.error('上传失败，请检查网络连接') }
  finally { submitting.value = false }
}

const resetForm = () => { formRef.value?.resetFields(); form.awardFiles = []; fileList.value = [] }
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

/* 双栏布局 */
.form-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
}
.form-col--wide { /* 右栏稍宽 */ }
.form-col__header { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-md); padding-bottom: var(--spacing-sm); border-bottom: 2px solid var(--border-color-light); }
.form-col__icon { font-size: 18px; }
.form-col__header h3 { font-size: var(--font-size-lg); font-weight: 700; color: var(--text-primary); margin: 0; }
.form-col__desc { font-size: var(--font-size-xs); color: var(--text-secondary); margin: 0 0 var(--spacing-md) 0; padding: var(--spacing-sm) var(--spacing-md); background: var(--color-primary-bg-light); border-radius: var(--radius-sm); border-left: 3px solid var(--color-primary); line-height: 1.5; }

.w-full { width: 100%; }

/* 紧凑拖拽 */
.compact-upload :deep(.el-upload-dragger) { padding: var(--spacing-lg) !important; }
.upload-drag-area { text-align: center; }
.upload-drag-icon { font-size: 32px; display: block; margin-bottom: 4px; }
.upload-drag-text { font-size: var(--font-size-sm); color: var(--text-primary); margin: 0 0 2px 0; }
.upload-drag-hint { font-size: 11px; color: var(--text-tertiary); margin: 0; }

/* 文件列表 */
.file-list { margin-top: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-xs); max-height: 160px; overflow-y: auto; }
.file-item { display: flex; align-items: center; gap: var(--spacing-xs); padding: var(--spacing-xs) var(--spacing-sm); background: var(--bg-page); border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
.file-item__icon { font-size: 14px; flex-shrink: 0; }
.file-item__name { flex: 1; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-item__remove { width: 20px; height: 20px; border: none; border-radius: 50%; background: transparent; color: var(--text-tertiary); cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all var(--transition-fast); }
.file-item__remove:hover { background: var(--color-danger-bg); color: var(--color-danger); }

/* 操作按钮 */
.form-actions { display: flex; justify-content: center; gap: var(--spacing-lg); padding: var(--spacing-lg) var(--spacing-xl); border-top: 1px solid var(--border-color-light); background: var(--bg-page); border-radius: 0 0 var(--radius-xl) var(--radius-xl); }

@media (max-width: 900px) {
  .form-layout { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .page-hero__inner { flex-direction: column; align-items: flex-start; gap: var(--spacing-sm); }
  .page-hero__steps { font-size: 11px; }
  .form-actions { flex-direction: column; }
  .form-actions .el-button { width: 100%; }
}
</style>
