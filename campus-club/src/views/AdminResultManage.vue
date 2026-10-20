<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-header">
        <div>
          <h2 class="page-header__title">成果管理</h2>
          <p class="page-header__subtitle">管理所有学生上传的成果</p>
        </div>
      </div>

      <div class="content-card" style="margin-bottom: var(--spacing-lg);">
        <el-input v-model="searchQuery" placeholder="搜索成果名称或学生姓名" class="search-input" clearable @clear="searchResults">
          <template #append><el-button type="primary" @click="searchResults">搜索</el-button></template>
        </el-input>
      </div>

      <div class="content-card" style="padding: 0; overflow: hidden;">
        <el-table :data="results" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="成果名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
          <el-table-column prop="student_id" label="学生ID" width="100" />
          <el-table-column prop="student_name" label="学生姓名" width="120" />
          <el-table-column prop="college" label="学院" width="120" />
          <el-table-column prop="create_time" label="创建时间" width="170" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="viewResult(scope.row)">查看</el-button>
              <el-button type="danger" size="small" link @click="deleteResult(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="padding: var(--spacing-lg); display: flex; justify-content: flex-end;">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,20,50,100]" layout="total,sizes,prev,pager,next,jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
      </div>

      <el-dialog v-model="resultDialogVisible" title="成果详情" width="600px">
        <el-form v-if="currentResult" :model="currentResult" label-width="80px">
          <el-form-item label="名称"><el-input :model-value="currentResult.title" disabled /></el-form-item>
          <el-form-item label="描述"><el-input :model-value="currentResult.description" type="textarea" disabled rows="3" /></el-form-item>
          <el-form-item label="学生ID"><el-input :model-value="currentResult.student_id" disabled /></el-form-item>
          <el-form-item label="学生姓名"><el-input :model-value="currentResult.student_name" disabled /></el-form-item>
          <el-form-item label="学院"><el-input :model-value="currentResult.college" disabled /></el-form-item>
          <el-form-item label="创建时间"><el-input :model-value="currentResult.create_time" disabled /></el-form-item>
          <el-form-item label="成果文件">
            <div v-if="currentResult.files && currentResult.files.length">
              <el-button v-for="f in currentResult.files" :key="f.id" type="primary" link size="small" @click="downloadFile(f.file_path, f.file_name)">{{ f.file_name }}</el-button>
            </div>
            <span v-else style="color: var(--text-tertiary);">无文件</span>
          </el-form-item>
        </el-form>
        <template #footer><el-button @click="resultDialogVisible = false">关闭</el-button></template>
      </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const searchQuery = ref(''); const results = ref([]); const currentPage = ref(1); const pageSize = ref(10); const total = ref(0); const loading = ref(false)
const resultDialogVisible = ref(false); const currentResult = ref(null)
onMounted(() => { getResults() })
const getResults = async () => {
  loading.value = true
  try { const res = await request({ url: '/api/admin/results', params: { page: currentPage.value, pageSize: pageSize.value, search: searchQuery.value } }); if (res.code === 200) { results.value = res.data.results; total.value = res.data.total } else ElMessage.error(res.msg || '获取失败') } catch { ElMessage.error('获取失败') } finally { loading.value = false }
}
const searchResults = () => { currentPage.value = 1; getResults() }
const viewResult = async (row) => { try { const res = await request({ url: '/api/admin/results/' + row.id }); if (res.code === 200) { currentResult.value = res.data; resultDialogVisible.value = true } else ElMessage.error(res.msg || '获取失败') } catch { ElMessage.error('获取失败') } }
const deleteResult = async (id) => { try { await ElMessageBox.confirm('确定删除该成果吗？', '确认删除', { type: 'warning' }) } catch { return }; try { const res = await request({ url: '/api/admin/results/' + id, method: 'delete' }); if (res.code === 200) { ElMessage.success('删除成功'); getResults() } else ElMessage.error(res.msg || '删除失败') } catch { ElMessage.error('删除失败') } }
const downloadFile = (filePath) => { window.open('http://localhost:3000/' + filePath, '_blank') }
const handleSizeChange = (s) => { pageSize.value = s; getResults() }
const handleCurrentChange = (c) => { currentPage.value = c; getResults() }
</script>
<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.search-input { max-width: 420px; }
</style>
