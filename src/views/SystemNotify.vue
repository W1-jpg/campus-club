<template>
  <PageLayout userType="student">
    <div class="view-content">
      <div class="page-header">
        <h1 class="page-header__title">系统通知</h1>
      </div>

      <div class="notice-list">
        <div class="content-card" v-for="item in noticeList" :key="item.id" @click="viewNotice(item)" style="cursor: pointer;">
          <div class="notice-header">
            <h3>{{ item.title }}</h3>
            <span class="notice-time">{{ formatTime(item.createTime) }}</span>
          </div>
          <div class="notice-content">{{ item.content }}</div>
          <div class="notice-footer">
            <span class="notice-publisher">发布者：{{ getPublisherName(item) }}</span>
          </div>
        </div>
      </div>

      <div class="empty-state" v-if="noticeList.length === 0">
        <div class="empty-icon">📭</div>
        <p>暂无系统通知</p>
      </div>
    </div>

    <el-dialog v-model="showDetailDialog" :title="currentNotice?.title" width="600px" @close="closeDetailDialog">
      <div class="notice-info">
        <div class="info-row"><span class="label">发布时间：</span><span class="value">{{ formatTime(currentNotice?.createTime) }}</span></div>
        <div class="info-row"><span class="label">发布者：</span><span class="value">{{ getPublisherName(currentNotice) }}</span></div>
      </div>
      <div class="notice-content-full">{{ currentNotice?.content }}</div>
      <template #footer><span class="dialog-footer"><el-button type="primary" @click="closeDetailDialog">关闭</el-button></span></template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const noticeList = ref([])
const showDetailDialog = ref(false)
const currentNotice = ref(null)

const formatTime = (time) => time ? new Date(time).toLocaleString('zh-CN') : ''

const getPublisherName = (notice) => {
  if (!notice) return ''
  if (notice.publisherType === 'teacher') return '教师端'
  if (notice.publisherType === 'system') return '系统'
  return '管理员'
}

const loadNotices = async () => {
  try {
    const studentId = localStorage.getItem('studentId')
    if (studentId) {
      const systemRes = await request({ url: '/api/notice/list', method: 'get' })
      const personalRes = await request({ url: `/api/notice/student/${studentId}`, method: 'get' })
      let allNotices = []
      if (systemRes.code === 200) allNotices = [...allNotices, ...systemRes.data]
      if (personalRes.code === 200) allNotices = [...allNotices, ...personalRes.data]
      allNotices.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      noticeList.value = allNotices
    }
  } catch (error) { console.error('加载通知失败:', error) }
}

const viewNotice = (notice) => { currentNotice.value = notice; showDetailDialog.value = true }
const closeDetailDialog = () => { showDetailDialog.value = false; currentNotice.value = null }

onMounted(() => { loadNotices() })
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

.notice-list { display: flex; flex-direction: column; gap: 20px; }

.notice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-md); }
.notice-header h3 { margin: 0; font-size: var(--font-size-xl); color: var(--text-primary); flex: 1; }
.notice-time { font-size: var(--font-size-sm); color: var(--text-tertiary); white-space: nowrap; margin-left: 20px; }

.notice-content { font-size: var(--font-size-base); color: var(--text-secondary); line-height: 1.6; margin-bottom: var(--spacing-md); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.notice-footer { padding-top: var(--spacing-md); border-top: 1px solid var(--border-color-light); }
.notice-publisher { font-size: var(--font-size-sm); color: var(--color-primary); }

.empty-state { text-align: center; padding: 80px 20px; }
.empty-icon { font-size: 80px; margin-bottom: 20px; }
.empty-state p { font-size: var(--font-size-lg); color: var(--text-tertiary); margin: 0; }

.notice-info { background-color: #f9fafc; padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: 20px; }
.info-row { display: flex; margin-bottom: var(--spacing-sm); }
.info-row:last-child { margin-bottom: 0; }
.label { font-size: var(--font-size-base); color: var(--text-secondary); width: 90px; }
.value { font-size: var(--font-size-base); color: var(--text-primary); }

.notice-content-full { font-size: 15px; color: var(--text-primary); line-height: 1.8; }
.dialog-footer { display: flex; justify-content: flex-end; }
</style>
