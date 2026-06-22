<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-header">
        <h1 class="page-header__title">系统通知管理</h1>
        <button class="btn-primary" @click="showCreateDialog = true">
          + 发布新通知
        </button>
      </div>

      <div class="notice-list">
        <div class="content-card content-card--accent" v-for="item in noticeList" :key="item.id">
          <div class="notice-header">
            <h3>{{ item.title }}</h3>
            <div class="notice-actions">
              <button class="btn-edit" @click="editNotice(item)">编辑</button>
              <button class="btn-delete" @click="deleteNotice(item.id)">删除</button>
            </div>
          </div>
          <div class="notice-content">{{ item.content }}</div>
          <div class="notice-footer">
            <span class="notice-time">发布时间：{{ formatTime(item.createTime) }}</span>
            <span class="notice-status" :class="{ active: item.status === 1 }">
              {{ item.status === 1 ? '已发布' : '草稿' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="showCreateDialog"
      :title="showEditDialog ? '编辑通知' : '发布新通知'"
      width="600px"
      @close="closeDialog"
    >
      <div class="form-group">
        <label>通知类型</label>
        <select v-model="noticeForm.noticeType" class="form-select">
          <option value="system">系统通知</option>
          <option value="personal">个人通知</option>
        </select>
      </div>
      <div class="form-group">
        <label>通知标题</label>
        <input type="text" v-model="noticeForm.title" placeholder="请输入通知标题" />
      </div>
      <div class="form-group">
        <label>通知内容</label>
        <textarea v-model="noticeForm.content" placeholder="请输入通知内容" rows="8"></textarea>
      </div>
      <div class="form-group" v-if="noticeForm.noticeType === 'personal'">
        <label>学生ID</label>
        <input type="number" v-model="noticeForm.studentId" placeholder="请输入学生ID" />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveNotice">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showEditDialog"
      title="编辑通知"
      width="600px"
      @close="closeDialog"
    >
      <div class="form-group">
        <label>通知标题</label>
        <input type="text" v-model="noticeForm.title" placeholder="请输入通知标题" />
      </div>
      <div class="form-group">
        <label>通知内容</label>
        <textarea v-model="noticeForm.content" placeholder="请输入通知内容" rows="8"></textarea>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="saveNotice">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const noticeList = ref([])
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const noticeForm = ref({
  id: null,
  noticeType: 'system',
  title: '',
  content: '',
  studentId: null
})

const formatTime = (time) => {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

const loadNotices = async () => {
  try {
    const res = await request({
      url: '/api/notice/list',
      method: 'get'
    })
    if (res.code === 200) {
      noticeList.value = res.data
    }
  } catch (error) {
    console.error('加载通知失败:', error)
  }
}

const editNotice = (notice) => {
  noticeForm.value = {
    id: notice.id,
    title: notice.title,
    content: notice.content
  }
  showEditDialog.value = true
}

const deleteNotice = async (id) => {
  if (confirm('确定要删除这条通知吗？')) {
    try {
      const res = await request({
        url: `/api/notice/delete/${id}`,
        method: 'delete'
      })
      if (res.code === 200) {
        alert('删除成功')
        loadNotices()
      } else {
        alert(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      alert('删除失败')
    }
  }
}

const saveNotice = async () => {
  if (!noticeForm.value.title || !noticeForm.value.content) {
    alert('请填写完整信息')
    return
  }

  try {
    let res
    if (showEditDialog.value) {
      res = await request({
        url: '/api/notice/update',
        method: 'put',
        data: noticeForm.value
      })
    } else {
      const publisherId = localStorage.getItem('teacherId')
      if (!publisherId) {
        alert('请先登录')
        return
      }
      const noticeData = {
        title: noticeForm.value.title,
        content: noticeForm.value.content,
        publisherId: Number(publisherId),
        publisherType: 'teacher',
        status: 1
      }
      if (noticeForm.value.noticeType === 'personal' && noticeForm.value.studentId) {
        noticeData.studentId = Number(noticeForm.value.studentId)
      }
      console.log('发送的通知数据:', noticeData)
      res = await request({
        url: '/api/notice/create',
        method: 'post',
        data: noticeData
      })
      console.log('保存通知的响应:', res)
    }

    if (res.code === 200) {
      alert(showEditDialog.value ? '更新成功' : '发布成功')
      closeDialog()
      loadNotices()
    } else {
      alert(res.msg || '操作失败')
    }
  } catch (error) {
    console.error('保存通知失败:', error)
    alert('操作失败')
  }
}

const closeDialog = () => {
  showCreateDialog.value = false
  showEditDialog.value = false
  noticeForm.value = {
    id: null,
    noticeType: 'system',
    title: '',
    content: '',
    studentId: null
  }
}

onMounted(() => {
  loadNotices()
})
</script>

<style scoped>
.view-content {
  max-width: var(--content-max-width-wide);
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.btn-primary {
  padding: 12px 24px;
  background: var(--gradient-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-lg);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(43, 90, 237, 0.4);
}

.notice-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.notice-header h3 {
  margin: 0;
  font-size: var(--font-size-xxl);
  color: var(--text-primary);
  flex: 1;
}

.notice-actions {
  display: flex;
  gap: 10px;
}

.btn-edit, .btn-delete {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-base);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all var(--transition-base);
}

.btn-edit {
  background-color: var(--color-info-bg);
  color: var(--color-primary);
}

.btn-edit:hover {
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

.btn-delete {
  background-color: var(--color-danger-bg);
  color: var(--color-danger);
}

.btn-delete:hover {
  background-color: var(--color-danger);
  color: var(--text-inverse);
}

.notice-content {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: var(--spacing-lg);
}

.notice-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-color-light);
}

.notice-time {
  font-size: var(--font-size-base);
  color: var(--text-tertiary);
}

.notice-status {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  background-color: #eee;
  color: var(--text-secondary);
}

.notice-status.active {
  background-color: var(--color-success-bg);
  color: var(--color-success);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-select {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  box-sizing: border-box;
  transition: border-color var(--transition-base);
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
}
</style>
