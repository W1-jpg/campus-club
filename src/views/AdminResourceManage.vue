<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-header">
        <div>
          <h2 class="page-header__title">资源管理</h2>
          <p class="page-header__subtitle">管理资源对接信息</p>
        </div>
        <el-button type="primary" @click="addResource"><el-icon><Plus /></el-icon>添加资源</el-button>
      </div>

      <div class="content-card" style="margin-bottom: var(--spacing-lg);">
        <el-input v-model="searchQuery" placeholder="搜索资源名称或类型" class="search-input" clearable @clear="searchResources">
          <template #append><el-button type="primary" @click="searchResources">搜索</el-button></template>
        </el-input>
      </div>

      <div class="content-card" style="padding: 0; overflow: hidden;">
        <el-table :data="resources" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.type === '资金支持' ? 'success' : scope.row.type === '导师指导' ? 'warning' : 'info'" size="small">{{ scope.row.type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="provider" label="提供者" width="150" />
          <el-table-column prop="publishTime" label="发布时间" width="120" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="viewResource(scope.row)">查看</el-button>
              <el-button type="success" size="small" link @click="editResource(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteResource(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="padding: var(--spacing-lg); display: flex; justify-content: flex-end;">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,20,50,100]" layout="total,sizes,prev,pager,next,jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
      </div>

      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
        <el-form :model="form" label-width="80px">
          <el-form-item label="名称"><el-input v-model="form.title" /></el-form-item>
          <el-form-item label="类型">
            <el-select v-model="form.type" style="width:100%">
              <el-option label="资金支持" value="资金支持" /><el-option label="导师指导" value="导师指导" />
              <el-option label="场地提供" value="场地提供" /><el-option label="设备支持" value="设备支持" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="描述"><el-input v-model="form.description" type="textarea" rows="4" /></el-form-item>
          <el-form-item label="提供者"><el-input v-model="form.provider" /></el-form-item>
          <el-form-item label="文件">
            <el-upload :auto-upload="false" :on-change="handleFileChange" :file-list="fileList" :limit="1">
              <el-button size="small">选择文件</el-button>
            </el-upload>
          </el-form-item>
        </el-form>
        <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="saveResource">保存</el-button></template>
      </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const searchQuery = ref(''); const resources = ref([]); const currentPage = ref(1); const pageSize = ref(10); const total = ref(0); const loading = ref(false)
const dialogVisible = ref(false); const dialogTitle = ref(''); const isAdd = ref(false)
const form = ref({ id: '', title: '', type: '', description: '', provider: '' })
const fileList = ref([]); const selectedFile = ref(null)
onMounted(() => { getResources() })
const getResources = async () => {
  loading.value = true
  try { const res = await request({ url: '/api/admin/resources', params: { page: currentPage.value, pageSize: pageSize.value, search: searchQuery.value } }); if (res.code === 200) { resources.value = res.data.resources; total.value = res.data.total } else ElMessage.error(res.msg || '获取失败') } catch { ElMessage.error('获取失败') } finally { loading.value = false }
}
const searchResources = () => { currentPage.value = 1; getResources() }
const addResource = () => { dialogTitle.value = '添加资源'; isAdd.value = true; form.value = { id: '', title: '', type: '', description: '', provider: '' }; fileList.value = []; selectedFile.value = null; dialogVisible.value = true }
const editResource = (row) => { dialogTitle.value = '编辑资源'; isAdd.value = false; form.value = { ...row }; fileList.value = []; selectedFile.value = null; dialogVisible.value = true }
const viewResource = (row) => { ElMessage.info(`查看资源：${row.title}`) }
const handleFileChange = (file) => { fileList.value = [file]; selectedFile.value = file.raw }
const saveResource = async () => {
  try {
    const fd = new FormData(); fd.append('title', form.value.title); fd.append('type', form.value.type); fd.append('description', form.value.description); fd.append('provider', form.value.provider)
    if (selectedFile.value) fd.append('resourceFile', selectedFile.value)
    const res = await request({ url: isAdd.value ? '/api/admin/resources' : '/api/admin/resources/' + form.value.id, method: isAdd.value ? 'post' : 'put', data: fd, headers: { 'Content-Type': 'multipart/form-data' } })
    if (res.code === 200) { ElMessage.success(isAdd.value ? '添加成功' : '编辑成功'); dialogVisible.value = false; getResources() } else ElMessage.error(res.msg || '操作失败')
  } catch { ElMessage.error('操作失败') }
}
const deleteResource = async (id) => { try { await ElMessageBox.confirm('确定删除该资源吗？', '确认删除', { type: 'warning' }) } catch { return }; try { const res = await request({ url: '/api/admin/resources/' + id, method: 'delete' }); if (res.code === 200) { ElMessage.success('删除成功'); getResources() } else ElMessage.error(res.msg || '删除失败') } catch { ElMessage.error('删除失败') } }
const handleSizeChange = (s) => { pageSize.value = s; getResources() }
const handleCurrentChange = (c) => { currentPage.value = c; getResources() }
</script>
<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.search-input { max-width: 420px; }
</style>
