<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-hero">
        <h1>评语模板</h1>
        <p>维护常用评语，评分时可直接复用</p>
      </div>
      <el-card shadow="never">
        <div class="add-row">
          <el-input v-model="content" placeholder="输入评语内容，例如：创新性较好，建议进一步完善实验数据" maxlength="500" show-word-limit />
          <el-button type="primary" @click="add" :loading="saving">添加模板</el-button>
        </div>
        <el-table :data="templates" v-loading="loading" empty-text="暂无评语模板">
          <el-table-column prop="content" label="评语内容" min-width="400" show-overflow-tooltip />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="100">
            <template #default="s"><el-button type="danger" link @click="remove(s.row.id)">删除</el-button></template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const templates = ref([])
const content = ref('')
const loading = ref(false)
const saving = ref(false)
const load = async () => {
  loading.value = true
  try { const res = await request.get('/api/teacher/templates'); if (res.code === 200) templates.value = res.data || [] } catch { ElMessage.error('获取模板失败') } finally { loading.value = false }
}
const add = async () => {
  if (!content.value.trim()) { ElMessage.warning('请输入评语内容'); return }
  saving.value = true
  try { const res = await request.post('/api/teacher/templates', { content: content.value.trim() }); if (res.code === 200) { ElMessage.success('添加成功'); content.value = ''; load() } else ElMessage.error(res.msg || '添加失败') } catch { ElMessage.error('添加失败') } finally { saving.value = false }
}
const remove = async (id) => {
  try { await ElMessageBox.confirm('确定删除该评语模板吗？', '提示', { type: 'warning' }) } catch { return }
  try { const res = await request.delete(`/api/teacher/templates/${id}`); if (res.code === 200) { ElMessage.success('删除成功'); load() } } catch { ElMessage.error('删除失败') }
}
onMounted(load)
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.add-row { display: flex; gap: 12px; margin-bottom: 20px; }
</style>
