<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-header">
        <div>
          <h2 class="page-header__title">通知管理</h2>
          <p class="page-header__subtitle">管理系统通知与公告</p>
        </div>
        <el-button type="primary" @click="addNotice"><el-icon><Plus /></el-icon>添加通知</el-button>
      </div>

      <div class="content-card" style="margin-bottom: var(--spacing-lg);">
        <el-input v-model="searchQuery" placeholder="搜索通知标题" class="search-input" clearable @clear="searchNotices">
          <template #append><el-button type="primary" @click="searchNotices">搜索</el-button></template>
        </el-input>
      </div>

      <div class="content-card" style="padding: 0; overflow: hidden;">
        <el-table :data="notices" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="通知标题" min-width="200" />
          <el-table-column prop="content" label="通知内容" min-width="300" show-overflow-tooltip />
          <el-table-column prop="create_time" label="创建时间" width="170" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="editNotice(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteNotice(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="padding: var(--spacing-lg); display: flex; justify-content: flex-end;">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,20,50,100]" layout="total,sizes,prev,pager,next,jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
      </div>

      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false">
        <el-form :model="form" label-width="80px">
          <el-form-item label="标题"><el-input v-model="form.title" /></el-form-item>
          <el-form-item label="内容"><el-input v-model="form.content" type="textarea" rows="5" /></el-form-item>
        </el-form>
        <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="saveNotice">保存</el-button></template>
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

const searchQuery = ref(''); const notices = ref([]); const currentPage = ref(1); const pageSize = ref(10); const total = ref(0); const loading = ref(false)
const dialogVisible = ref(false); const dialogTitle = ref(''); const isAdd = ref(false); const form = ref({ id: '', title: '', content: '' })
onMounted(() => { getNotices() })
const getNotices = async () => {
  loading.value = true
  try { const res = await request({ url: '/api/admin/notices', params: { page: currentPage.value, pageSize: pageSize.value, search: searchQuery.value } }); if (res.code === 200) { notices.value = res.data.notices; total.value = res.data.total } else ElMessage.error(res.msg || '获取失败') } catch { ElMessage.error('获取失败') } finally { loading.value = false }
}
const searchNotices = () => { currentPage.value = 1; getNotices() }
const addNotice = () => { dialogTitle.value = '添加通知'; isAdd.value = true; form.value = { id: '', title: '', content: '' }; dialogVisible.value = true }
const editNotice = (row) => { dialogTitle.value = '编辑通知'; isAdd.value = false; form.value = { ...row }; dialogVisible.value = true }
const saveNotice = async () => {
  try { const res = await request({ url: isAdd.value ? '/api/admin/notices' : '/api/admin/notices/' + form.value.id, method: isAdd.value ? 'post' : 'put', data: form.value }); if (res.code === 200) { ElMessage.success(isAdd.value ? '添加成功' : '编辑成功'); dialogVisible.value = false; getNotices() } else ElMessage.error(res.msg || '操作失败') } catch { ElMessage.error('操作失败') }
}
const deleteNotice = async (id) => {
  try { await ElMessageBox.confirm('确定要删除该通知吗？', '确认删除', { type: 'warning' }) } catch { return }
  try { const res = await request({ url: '/api/admin/notices/' + id, method: 'delete' }); if (res.code === 200) { ElMessage.success('删除成功'); getNotices() } else ElMessage.error(res.msg || '删除失败') } catch { ElMessage.error('删除失败') }
}
const handleSizeChange = (s) => { pageSize.value = s; getNotices() }
const handleCurrentChange = (c) => { currentPage.value = c; getNotices() }
</script>
<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.search-input { max-width: 420px; }
</style>
