<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-header">
        <h1 class="page-header__title">资源对接</h1>
        <button class="btn-primary" @click="showPublishDialog = true">+ 发布资源</button>
      </div>

      <div class="filter-bar">
        <select v-model="filterType" class="filter-select" @change="loadResources">
          <option value="">全部类型</option>
          <option value="资金支持">资金支持</option>
          <option value="导师指导">导师指导</option>
          <option value="场地提供">场地提供</option>
          <option value="设备支持">设备支持</option>
        </select>
      </div>

      <div class="resource-list">
        <div class="content-card content-card--accent" v-for="item in resourceList" :key="item.id">
          <div class="card-header">
            <div class="header-left">
              <span class="type-icon">{{ getTypeIcon(item.type) }}</span>
              <div>
                <h3>{{ item.title }}</h3>
                <span class="type-badge">{{ getTypeText(item.type) }}</span>
              </div>
            </div>
            <span class="status-badge" :class="item.status === '进行中' ? 'active' : 'expired'">{{ getStatusText(item.status) }}</span>
          </div>
          <div class="card-body">
            <div class="info-row"><span class="label">提供方：</span><span class="value">{{ item.provider }}</span></div>
            <div class="info-row"><span class="label">发布时间：</span><span class="value">{{ formatTime(item.publishTime) }}</span></div>
            <div class="info-row" v-if="item.endTime"><span class="label">截止时间：</span><span class="value">{{ formatTime(item.endTime) }}</span></div>
            <div class="description"><span class="label">资源描述：</span><span class="value">{{ item.description }}</span></div>
            <div class="stats-row">
              <span class="stat-item">浏览：{{ item.viewCount }}</span>
              <span class="stat-item">申请：{{ item.applyCount }}</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-applicants" @click="viewApplicants(item)">查看申请</button>
            <button class="btn-edit" @click="editResource(item)">编辑</button>
            <el-button type="danger" plain size="small" @click="confirmDelete(item)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showPublishDialog" title="发布资源" width="500px" @close="closePublishDialog">
      <div class="form-group"><label>资源标题</label><input type="text" v-model="resourceForm.title" placeholder="请输入资源标题" /></div>
      <div class="form-group"><label>资源类型</label><select v-model="resourceForm.type" class="form-select"><option value="">请选择</option><option value="资金支持">资金支持</option><option value="导师指导">导师指导</option><option value="场地提供">场地提供</option><option value="设备支持">设备支持</option></select></div>
      <div class="form-group"><label>提供方</label><input type="text" v-model="resourceForm.provider" placeholder="请输入提供方" /></div>
      <div class="form-group"><label>资源描述</label><textarea v-model="resourceForm.description" placeholder="请输入资源描述" rows="4"></textarea></div>
      <div class="form-group"><label>发布时间</label><input type="datetime-local" v-model="resourceForm.publishTime" /></div>
      <div class="form-group"><label>截止时间（可选）</label><input type="datetime-local" v-model="resourceForm.endTime" /></div>
      <div class="form-group"><label>状态</label><select v-model="resourceForm.status" class="form-select"><option value="进行中">进行中</option><option value="已结束">已结束</option></select></div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closePublishDialog">取消</el-button>
          <el-button type="primary" @click="publishResource">发布</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="资源详情与申请记录" width="700px" @close="closeDetailDialog">
      <div v-if="currentResource" class="resource-detail">
        <div class="detail-section">
          <h3>{{ currentResource.title }}</h3>
          <div class="detail-info">
            <div class="info-row"><span class="label">资源类型：</span><span class="value">{{ currentResource.type }}</span></div>
            <div class="info-row"><span class="label">提供方：</span><span class="value">{{ currentResource.provider }}</span></div>
            <div class="info-row"><span class="label">发布时间：</span><span class="value">{{ formatTime(currentResource.publishTime) }}</span></div>
            <div class="info-row" v-if="currentResource.endTime"><span class="label">截止时间：</span><span class="value">{{ formatTime(currentResource.endTime) }}</span></div>
            <div class="info-row"><span class="label">状态：</span><span class="value">{{ currentResource.status }}</span></div>
            <div class="info-row"><span class="label">浏览次数：</span><span class="value">{{ currentResource.viewCount }}</span></div>
            <div class="info-row"><span class="label">申请次数：</span><span class="value">{{ currentResource.applyCount }}</span></div>
          </div>
          <div class="description-section"><h4>资源描述</h4><p>{{ currentResource.description }}</p></div>
        </div>
        <div class="applications-section">
          <h4>申请记录</h4>
          <div v-if="resourceApplications.length > 0" class="applications-list">
            <div class="application-item" v-for="app in resourceApplications" :key="app.id">
              <div class="application-header">
                <span class="student-name">{{ app.studentName }}</span>
                <span class="application-status" :class="app.status">{{ app.status }}</span>
              </div>
              <div class="application-info">
                <div class="info-row"><span class="label">学生ID：</span><span class="value">{{ app.studentId }}</span></div>
                <div class="info-row"><span class="label">所在学院：</span><span class="value">{{ app.studentCollege }}</span></div>
                <div class="info-row"><span class="label">申请时间：</span><span class="value">{{ formatTime(app.applicationTime) }}</span></div>
              </div>
              <div class="application-actions" v-if="app.status === '待审核'">
                <el-button type="success" size="small" @click="approveApplication(app.id)">批准</el-button>
                <el-button type="danger" size="small" @click="rejectApplication(app.id)">拒绝</el-button>
              </div>
            </div>
          </div>
          <div v-else class="no-applications"><p>暂无申请记录</p></div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDetailDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const filterType = ref('')
const resourceList = ref([])
const showPublishDialog = ref(false)
const showDetailDialog = ref(false)
const currentResource = ref(null)
const resourceApplications = ref([])
const resourceForm = ref({ title: '', type: '', provider: '', description: '', publishTime: new Date().toISOString().slice(0, 16), endTime: '', status: '进行中' })

const formatTime = (time) => time ? new Date(time).toLocaleString('zh-CN') : ''
const getTypeIcon = (type) => ({ '资金支持': '💰', '导师指导': '👨‍🏫', '场地提供': '🏢', '设备支持': '🔧' }[type] || '📦')
const getTypeText = (type) => type || ''
const getStatusText = (status) => status || ''

const loadResources = async () => {
  try {
    let url = '/api/resource/list'
    if (filterType.value) url = `/api/resource/type/${filterType.value}`
    const response = await request.get(url)
    resourceList.value = response.data
  } catch (error) { console.error('加载资源失败:', error); alert('加载资源失败，请检查网络连接') }
}

const viewDetail = (item) => { showDetailDialog.value = true; currentResource.value = item; loadApplications(item.id) }

const loadApplications = async (resourceId) => {
  try { const response = await request.get(`/api/resource/applications/resource/${resourceId}`); resourceApplications.value = response.data }
  catch (error) { console.error('加载申请记录失败:', error) }
}

const closeDetailDialog = () => { showDetailDialog.value = false; currentResource.value = null; resourceApplications.value = [] }

const confirmDelete = (item) => { if (confirm(`确定要删除资源 "${item.title}" 吗？此操作不可恢复。`)) deleteResource(item.id) }

const deleteResource = async (resourceId) => {
  try { await request.delete(`/api/resource/${resourceId}`); alert('资源删除成功！'); loadResources() }
  catch (error) { console.error('删除资源失败:', error); alert('删除资源失败，请稍后重试') }
}

const approveApplication = async (applicationId) => {
  try { await request.put(`/api/resource/applications/${applicationId}/status`, {}, { params: { status: '已通过' } }); alert('申请批准成功！'); if (currentResource.value) loadApplications(currentResource.value.id) }
  catch (error) { console.error('批准申请失败:', error); alert('批准申请失败，请稍后重试') }
}

const rejectApplication = async (applicationId) => {
  try { await request.put(`/api/resource/applications/${applicationId}/status`, {}, { params: { status: '已拒绝' } }); alert('申请拒绝成功！'); if (currentResource.value) loadApplications(currentResource.value.id) }
  catch (error) { console.error('拒绝申请失败:', error); alert('拒绝申请失败，请稍后重试') }
}

const viewApplicants = (item) => { showDetailDialog.value = true; currentResource.value = item; loadApplications(item.id) }

const editResource = (item) => {
  resourceForm.value = { title: item.title, type: item.type, provider: item.provider, description: item.description, publishTime: new Date(item.publishTime).toISOString().slice(0, 16), endTime: item.endTime ? new Date(item.endTime).toISOString().slice(0, 16) : '', status: item.status }
  showPublishDialog.value = true
}

const closePublishDialog = () => { showPublishDialog.value = false; resourceForm.value = { title: '', type: '', provider: '', description: '', publishTime: new Date().toISOString().slice(0, 16), endTime: '', status: '进行中' } }

const publishResource = async () => {
  if (!resourceForm.value.title || !resourceForm.value.type || !resourceForm.value.description || !resourceForm.value.provider) { alert('请填写完整信息'); return }
  try {
    const resourceData = { title: resourceForm.value.title, type: resourceForm.value.type, provider: resourceForm.value.provider, description: resourceForm.value.description, publishTime: new Date(resourceForm.value.publishTime), endTime: resourceForm.value.endTime ? new Date(resourceForm.value.endTime) : null, status: resourceForm.value.status }
    await request.post('/api/resource', resourceData)
    alert('资源发布成功！'); closePublishDialog(); loadResources()
  } catch (error) { console.error('发布资源失败:', error); alert('发布资源失败，请稍后重试') }
}

onMounted(() => { loadResources() })
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-xl); }

.btn-primary { padding: 12px 24px; background: var(--gradient-primary); color: var(--text-inverse); border: none; border-radius: var(--radius-md); font-size: var(--font-size-lg); cursor: pointer; transition: all var(--transition-base); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43, 90, 237, 0.4); }

.filter-bar { margin-bottom: 20px; }
.filter-select { padding: 10px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: var(--font-size-base); background-color: var(--bg-card); }

.resource-list { display: flex; flex-direction: column; gap: 20px; }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-lg); }
.header-left { display: flex; gap: var(--spacing-lg); align-items: flex-start; }
.type-icon { font-size: 36px; }
.header-left h3 { margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-xxl); color: var(--text-primary); }
.type-badge { display: inline-block; padding: 2px 10px; background-color: var(--color-primary-bg); color: var(--color-primary); border-radius: var(--radius-sm); font-size: var(--font-size-xs); }

.status-badge { padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
.status-badge.active { background-color: var(--color-success-bg); color: var(--color-success); }
.status-badge.expired { background-color: var(--color-danger-bg); color: var(--color-danger); }

.card-body { margin-bottom: var(--spacing-lg); }

.info-row { display: flex; margin-bottom: var(--spacing-sm); }
.label { font-size: var(--font-size-base); color: var(--text-secondary); width: 90px; }
.value { font-size: var(--font-size-base); color: var(--text-primary); }

.description { margin-top: var(--spacing-md); display: flex; }
.description .value { flex: 1; line-height: 1.6; }

.stats-row { margin-top: var(--spacing-md); display: flex; gap: 20px; }
.stat-item { font-size: var(--font-size-sm); color: var(--text-tertiary); }

.card-footer { display: flex; gap: var(--spacing-md); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color-light); }

.btn-applicants, .btn-edit { padding: 10px 20px; border: none; border-radius: var(--radius-md); font-size: var(--font-size-base); cursor: pointer; transition: all var(--transition-base); }
.btn-applicants { background-color: var(--color-primary-bg); color: var(--color-primary); }
.btn-applicants:hover { background-color: var(--color-primary); color: var(--text-inverse); }
.btn-edit { background: var(--gradient-primary); color: var(--text-inverse); }
.btn-edit:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43, 90, 237, 0.4); }

.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: var(--spacing-sm); font-size: var(--font-size-base); color: var(--text-primary); font-weight: 500; }
.form-group input, .form-group textarea, .form-select { width: 100%; padding: var(--spacing-md); border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: var(--font-size-base); box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus, .form-select:focus { outline: none; border-color: var(--color-primary); }

.dialog-footer { display: flex; justify-content: flex-end; gap: var(--spacing-md); }

.resource-detail { display: flex; flex-direction: column; gap: var(--spacing-xl); }
.detail-section h3 { margin: 0 0 var(--spacing-lg) 0; font-size: var(--font-size-xxl); color: var(--text-primary); }
.detail-info { margin-bottom: var(--spacing-lg); }
.description-section { margin-top: var(--spacing-lg); padding-top: var(--spacing-lg); border-top: 1px solid var(--border-color-light); }
.description-section h4 { margin: 0 0 var(--spacing-sm) 0; font-size: var(--font-size-lg); color: var(--text-primary); }
.description-section p { margin: 0; line-height: 1.6; color: var(--text-secondary); }

.applications-section { margin-top: var(--spacing-xl); }
.applications-section h4 { margin: 0 0 var(--spacing-lg) 0; font-size: var(--font-size-lg); color: var(--text-primary); }
.applications-list { display: flex; flex-direction: column; gap: var(--spacing-md); max-height: 400px; overflow-y: auto; padding-right: var(--spacing-sm); }
.application-item { background-color: var(--bg-page); border-radius: var(--radius-md); padding: var(--spacing-lg); }
.application-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md); }
.student-name { font-weight: 500; color: var(--text-primary); }
.application-status { padding: var(--spacing-xs) var(--spacing-md); border-radius: var(--radius-sm); font-size: var(--font-size-xs); }
.application-status[class*="待审核"] { background-color: var(--color-warning-bg); color: var(--color-warning); }
.application-status[class*="已通过"] { background-color: var(--color-success-bg); color: var(--color-success); }
.application-status[class*="已拒绝"] { background-color: var(--color-danger-bg); color: var(--color-danger); }
.application-actions { display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-md); padding-top: var(--spacing-md); border-top: 1px solid var(--border-color); }
.no-applications { text-align: center; padding: 20px; color: var(--text-tertiary); }
</style>
