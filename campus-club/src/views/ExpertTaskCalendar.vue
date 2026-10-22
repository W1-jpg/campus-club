<template>
  <PageLayout userType="expert">
    <div class="view-content">
      <div class="page-hero">
        <h1>评审任务日历</h1>
        <p>按提交时间查看待评审任务，合理安排评审进度</p>
      </div>
      <el-card shadow="never">
        <div class="toolbar">
          <el-input v-model="search" placeholder="搜索成果名称" clearable style="width: 260px" />
          <el-tag type="warning">待评审 {{ filtered.length }} 项</el-tag>
        </div>
        <el-table :data="filtered" v-loading="loading" empty-text="暂无待评审任务">
          <el-table-column prop="createTime" label="提交时间" width="180" />
          <el-table-column prop="title" label="成果名称" min-width="240" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="110" />
          <el-table-column label="阶段评分" width="100" align="center">
            <template #default="s">{{ s.row.score || 0 }}</template>
          </el-table-column>
          <el-table-column label="孵化评分" width="100" align="center">
            <template #default="s">{{ s.row.incubationScore || 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default><el-tag type="warning">待评审</el-tag></template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const tasks = ref([])
const search = ref('')
const loading = ref(false)
const filtered = computed(() => tasks.value
  .filter(t => !search.value || String(t.title || '').includes(search.value))
  .sort((a, b) => String(b.createTime || '').localeCompare(String(a.createTime || ''))))
onMounted(async () => {
  loading.value = true
  try { const res = await request.get('/api/expert/tasks'); if (res.code === 200) tasks.value = res.data || [] } catch { ElMessage.error('获取任务失败') } finally { loading.value = false }
})
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
