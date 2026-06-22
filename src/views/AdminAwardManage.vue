<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-header">
        <div>
          <h2 class="page-header__title">获奖管理</h2>
          <p class="page-header__subtitle">管理所有学生获奖记录</p>
        </div>
      </div>

      <div class="content-card" style="margin-bottom: var(--spacing-lg);">
        <el-input v-model="searchQuery" placeholder="搜索奖项名称或学生姓名" class="search-input" clearable @clear="searchAwards">
          <template #append><el-button type="primary" @click="searchAwards">搜索</el-button></template>
        </el-input>
      </div>

      <div class="content-card" style="padding: 0; overflow: hidden;">
        <el-table :data="awards" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="title" label="奖项名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="level" label="获奖等级" width="120">
            <template #default="scope">
              <el-tag :type="scope.row.level === '国家级' ? 'danger' : scope.row.level === '省级' ? 'warning' : 'info'" size="small">{{ scope.row.level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="award_time" label="获奖时间" width="120" />
          <el-table-column prop="student_name" label="学生姓名" width="120" />
          <el-table-column prop="college" label="学院" width="120" />
          <el-table-column prop="create_time" label="创建时间" width="170" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="viewAward(scope.row)">查看</el-button>
              <el-button type="danger" size="small" link @click="deleteAward(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="padding: var(--spacing-lg); display: flex; justify-content: flex-end;">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10,20,50,100]" layout="total,sizes,prev,pager,next,jumper" :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange" />
        </div>
      </div>

      <el-dialog v-model="awardDialogVisible" title="获奖详情" width="600px">
        <el-form v-if="currentAward" :model="currentAward" label-width="80px">
          <el-form-item label="奖项名称"><el-input :model-value="currentAward.title" disabled /></el-form-item>
          <el-form-item label="获奖等级"><el-input :model-value="currentAward.level" disabled /></el-form-item>
          <el-form-item label="获奖时间"><el-input :model-value="currentAward.award_time" disabled /></el-form-item>
          <el-form-item label="描述"><el-input :model-value="currentAward.description" type="textarea" disabled rows="3" /></el-form-item>
          <el-form-item label="学生姓名"><el-input :model-value="currentAward.student_name" disabled /></el-form-item>
          <el-form-item label="学院"><el-input :model-value="currentAward.college" disabled /></el-form-item>
          <el-form-item label="获奖文件">
            <div v-if="currentAward.files && currentAward.files.length">
              <el-button v-for="f in currentAward.files" :key="f.id" type="primary" link size="small" @click="downloadFile(f.file_path, f.file_name)">{{ f.file_name }}</el-button>
            </div>
            <span v-else style="color: var(--text-tertiary);">无文件</span>
          </el-form-item>
        </el-form>
        <template #footer><el-button @click="awardDialogVisible = false">关闭</el-button></template>
      </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const searchQuery = ref(''); const awards = ref([]); const currentPage = ref(1); const pageSize = ref(10); const total = ref(0); const loading = ref(false)
const awardDialogVisible = ref(false); const currentAward = ref(null)
onMounted(() => { getAwards() })
const getAwards = async () => {
  loading.value = true
  try { const res = await request({ url: '/api/admin/awards', params: { page: currentPage.value, pageSize: pageSize.value, search: searchQuery.value } }); if (res.code === 200) { awards.value = res.data.awards; total.value = res.data.total } else ElMessage.error(res.msg || '获取失败') } catch { ElMessage.error('获取失败') } finally { loading.value = false }
}
const searchAwards = () => { currentPage.value = 1; getAwards() }
const viewAward = async (row) => { try { const res = await request({ url: '/api/admin/awards/' + row.id }); if (res.code === 200) { currentAward.value = res.data; awardDialogVisible.value = true } else ElMessage.error(res.msg || '获取失败') } catch { ElMessage.error('获取失败') } }
const deleteAward = async (id) => { try { await ElMessageBox.confirm('确定删除该获奖记录吗？', '确认删除', { type: 'warning' }) } catch { return }; try { const res = await request({ url: '/api/admin/awards/' + id, method: 'delete' }); if (res.code === 200) { ElMessage.success('删除成功'); getAwards() } else ElMessage.error(res.msg || '删除失败') } catch { ElMessage.error('删除失败') } }
const downloadFile = (filePath) => { window.open('http://localhost:3000/' + filePath, '_blank') }
const handleSizeChange = (s) => { pageSize.value = s; getAwards() }
const handleCurrentChange = (c) => { currentPage.value = c; getAwards() }
</script>
<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.search-input { max-width: 420px; }
</style>
