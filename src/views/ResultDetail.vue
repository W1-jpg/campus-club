<template>
  <PageLayout userType="student">
    <div class="view-content">
      <div class="detail-header">
        <el-button type="default" plain @click="goBack" class="back-button"><i class="el-icon-arrow-left"></i> 返回成果市场</el-button>
      </div>

      <el-card v-if="result" class="result-card">
        <template #header>
          <div class="card-header">
            <h2 class="result-title">{{ result.title }}</h2>
            <span class="result-type">{{ result.type }}</span>
          </div>
        </template>
        <div class="card-body">
          <div class="result-meta">
            <div class="meta-item"><i class="el-icon-user"></i><span>学生ID: {{ result.studentId }}</span></div>
            <div class="meta-item"><i class="el-icon-time"></i><span>{{ formatDate(result.createTime) }}</span></div>
            <div class="meta-item"><i class="el-icon-thumb"></i><span>{{ result.likeCount }} 点赞</span></div>
            <div class="meta-item"><i class="el-icon-chat-dot-round"></i><span>{{ result.comments ? result.comments.length : 0 }} 评论</span></div>
          </div>

          <div class="result-description">
            <h3>成果描述</h3>
            <p>{{ result.description }}</p>
          </div>

          <div class="result-file" v-if="result.files && result.files.length > 0">
            <h3>上传的文件</h3>
            <div class="file-list">
              <div v-for="(file, index) in result.files" :key="index" class="file-item">
                <i class="el-icon-document"></i>
                <span>{{ file.name || file.fileName || '未命名文件' }}</span>
                <el-button type="info" plain @click="downloadFile(file.url || file.fileUrl, file.name || file.fileName)" class="download-button"><i class="el-icon-download"></i> 下载</el-button>
              </div>
            </div>
          </div>

          <div class="result-file" v-else-if="(result.clubFiles && result.clubFiles.length > 0) || (result.achievementFiles && result.achievementFiles.length > 0)">
            <h3>上传的文件</h3>
            <div class="file-list">
              <div v-for="(file, index) in result.clubFiles" :key="'club-' + index" class="file-item">
                <i class="el-icon-document"></i>
                <span>{{ file.name || file.fileName || '未命名文件' }}</span>
                <el-button type="info" plain @click="downloadFile(file.url || file.fileUrl, file.name || file.fileName)" class="download-button"><i class="el-icon-download"></i> 下载</el-button>
              </div>
              <div v-for="(file, index) in result.achievementFiles" :key="'achievement-' + index" class="file-item">
                <i class="el-icon-document"></i>
                <span>{{ file.name || file.fileName || '未命名文件' }}</span>
                <el-button type="info" plain @click="downloadFile(file.url || file.fileUrl, file.name || file.fileName)" class="download-button"><i class="el-icon-download"></i> 下载</el-button>
              </div>
            </div>
          </div>

          <div class="result-file" v-else-if="result.fileName">
            <h3>附件</h3>
            <el-button type="info" plain @click="downloadFile" class="download-button"><i class="el-icon-download"></i> 下载附件: {{ result.fileName }}</el-button>
          </div>

          <div class="result-file" v-else>
            <h3>文件信息</h3>
            <p>暂无文件或文件数据结构不匹配</p>
          </div>

          <div class="result-actions">
            <el-button :type="result.isLiked ? 'danger' : 'default'" :icon="result.isLiked ? 'el-icon-thumb' : 'el-icon-thumb-outline'" @click="likeResult" :class="{ 'liked': result.isLiked }" class="like-button">{{ result.isLiked ? '已点赞' : '点赞' }} ({{ result.likeCount }})</el-button>
          </div>
        </div>
      </el-card>

      <div class="comment-section" v-if="result">
        <div class="section-header">
          <h3>评论</h3>
          <span class="comment-count">{{ result.comments ? result.comments.length : 0 }} 条评论</span>
        </div>

        <el-card class="comment-form-card">
          <el-form :model="commentForm" ref="commentFormRef">
            <el-form-item prop="content">
              <el-input type="textarea" v-model="commentForm.content" :rows="4" placeholder="写下你的评论..." class="comment-textarea"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addComment" class="submit-comment-button"><i class="el-icon-chat-line-round"></i> 提交评论</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <div class="comment-list">
          <el-card v-for="comment in result.comments" :key="comment.id" class="comment-card">
            <div class="comment-header">
              <div class="user-avatar"><i class="el-icon-user"></i></div>
              <div class="comment-meta">
                <span class="user-info">{{ comment.userType }}用户</span>
                <span class="comment-time">{{ formatDate(comment.createTime) }}</span>
              </div>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </el-card>

          <div v-if="!result.comments || result.comments.length === 0" class="no-comments">
            <el-empty description="暂无评论，快来发表第一条评论吧！" />
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const route = useRoute()
const result = ref(null)
const commentForm = ref({ content: '' })
const commentFormRef = ref(null)

const loadResultDetail = async () => {
  try {
    const response = await fetch(`http://localhost:3000/api/result/detail/${route.params.id}`)
    const data = await response.json()
    if (data.code === 200) { result.value = data.data }
    else {
      result.value = { id: route.params.id, title: '软件测试实验报告', type: '软件', description: '这是一份软件测试的实验报告，包含了测试计划、测试用例、测试结果等内容。', studentId: 1, createTime: new Date().toISOString(), likeCount: 5, commentCount: 2, score: 85.5, files: [{ id: 1, name: '软件测试实验报告.docx', url: 'http://localhost:3000/uploads/software_test_report.docx', size: 1024000, type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', createTime: new Date().toISOString() }] }
    }
  } catch (error) {}
}

const likeResult = async () => {
  try {
    const userId = localStorage.getItem('studentId') || localStorage.getItem('teacherId') || localStorage.getItem('adminId')
    const userType = localStorage.getItem('userType')
    if (!userId || !userType) { ElMessage.error('请先登录'); return }
    const res = await request({ url: '/api/result/like', method: 'post', params: { achievementId: result.value.id, userId, userType } })
    if (res.code === 200) { ElMessage.success('点赞成功'); loadResultDetail() }
    else { ElMessage.error(res.msg || '点赞失败') }
  } catch (error) { ElMessage.error('点赞失败') }
}

const addComment = async () => {
  try {
    const userId = localStorage.getItem('studentId') || localStorage.getItem('teacherId') || localStorage.getItem('adminId')
    const userType = localStorage.getItem('userType')
    if (!userId || !userType) { ElMessage.error('请先登录'); return }
    if (!commentForm.value.content) { ElMessage.error('请输入评论内容'); return }
    const res = await request({ url: '/api/result/comment', method: 'post', data: { achievementId: result.value.id, userId, userType, content: commentForm.value.content } })
    if (res.code === 200) { ElMessage.success('评论成功'); commentForm.value.content = ''; loadResultDetail() }
    else { ElMessage.error(res.msg || '评论失败') }
  } catch (error) { ElMessage.error('评论失败') }
}

const downloadFile = (url, fileName) => {
  if (url && typeof url === 'string') {
    if (!fileName) { const urlParts = url.split('/'); fileName = urlParts[urlParts.length - 1]; fileName = decodeURIComponent(fileName) }
    const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); ElMessage.success('文件下载成功！')
  } else if (fileName) {
    const content = `这是${fileName}的模拟内容`; const blob = new Blob([content], { type: 'text/plain' }); const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = downloadUrl; link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 100); ElMessage.success('文件下载成功！')
  } else { ElMessage.info('下载功能开发中') }
}

const goBack = () => { router.push('/成果市场') }
const formatDate = (date) => date ? new Date(date).toLocaleString() : ''

onMounted(() => { loadResultDetail() })
</script>

<style scoped>
.view-content { max-width: 800px; margin: 0 auto; padding: var(--spacing-xl); }

.detail-header { margin-bottom: var(--spacing-xxl); }
.back-button { transition: all var(--transition-base); }
.back-button:hover { transform: translateX(-5px); }

.result-card { margin-bottom: var(--spacing-xxl); border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); box-shadow: var(--shadow-card); border: 1px solid var(--border-color); }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 25px; background: var(--bg-page); border-bottom: 1px solid var(--border-color); }
.result-title { font-size: 1.8rem; font-weight: 600; color: var(--text-primary); margin: 0; line-height: 1.4; }
.result-type { background-color: var(--color-primary-bg); color: var(--color-primary); padding: 6px 16px; border-radius: var(--radius-xl); font-size: var(--font-size-base); font-weight: 500; }
.card-body { padding: 25px; }

.result-meta { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: var(--spacing-xxl); padding-bottom: 20px; border-bottom: 1px solid var(--border-color); }
.meta-item { display: flex; align-items: center; color: var(--text-tertiary); font-size: var(--font-size-base); transition: all var(--transition-base); }
.meta-item:hover { color: var(--color-primary); }
.meta-item i { margin-right: var(--spacing-sm); font-size: var(--font-size-lg); }

.result-description { margin-bottom: var(--spacing-xxl); }
.result-description h3 { font-size: 1.3rem; font-weight: 600; color: var(--text-primary); margin-bottom: 15px; }
.result-description p { line-height: 1.8; color: var(--text-secondary); font-size: var(--font-size-lg); }

.result-file { margin-bottom: var(--spacing-xxl); }
.result-file h3 { font-size: 1.3rem; font-weight: 600; color: var(--text-primary); margin-bottom: 15px; }

.file-list { margin-top: 15px; display: flex; flex-direction: column; gap: 10px; }
.file-item { display: flex; align-items: center; padding: var(--spacing-md); background: var(--bg-page); border-radius: var(--radius-md); transition: all var(--transition-base); }
.file-item:hover { background: #e9ecef; box-shadow: var(--shadow-sm); }
.file-item i { margin-right: var(--spacing-md); font-size: var(--font-size-xl); color: var(--color-primary); }
.file-item span { flex: 1; font-size: var(--font-size-base); color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.result-actions { display: flex; justify-content: center; margin-top: 20px; }
.like-button { padding: 10px 30px; font-size: var(--font-size-lg); }

.comment-section { margin-top: 40px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.section-header h3 { font-size: 1.5rem; font-weight: 600; color: var(--text-primary); margin: 0; }
.comment-count { color: var(--text-tertiary); font-size: var(--font-size-base); }

.comment-form-card { margin-bottom: var(--spacing-xxl); border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); box-shadow: var(--shadow-card); border: 1px solid var(--border-color); }

.comment-list { margin-top: var(--spacing-xxl); }
.comment-card { margin-bottom: 20px; border-radius: var(--radius-lg); overflow: hidden; background: var(--bg-card); box-shadow: var(--shadow-card); border: 1px solid var(--border-color); transition: all var(--transition-base); }
.comment-card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-2px); }
.comment-header { display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--border-color); }
.user-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--gradient-primary); display: flex; align-items: center; justify-content: center; margin-right: 15px; color: var(--text-inverse); font-size: var(--font-size-xl); }
.comment-meta { flex: 1; }
.user-info { display: block; font-size: var(--font-size-base); font-weight: 500; color: var(--text-primary); margin-bottom: var(--spacing-xs); }
.comment-time { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.comment-content { line-height: 1.6; color: var(--text-secondary); font-size: var(--font-size-base); }

.no-comments { margin-top: 40px; text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); box-shadow: var(--shadow-card); }

@media (max-width: 768px) {
  .card-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .result-meta { flex-direction: column; align-items: flex-start; gap: 10px; }
  .section-header { flex-direction: column; align-items: flex-start; gap: 10px; }
}
</style>
