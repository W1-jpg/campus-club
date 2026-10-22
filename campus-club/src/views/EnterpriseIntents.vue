<template>
  <PageLayout userType="enterprise">
    <div class="view-content">
      <div class="page-hero">
        <h1>合作意向</h1>
        <p>查看已向学生发起的合作意向及回复</p>
      </div>
      <el-card class="table-card" shadow="never">
        <el-table :data="list" v-loading="loading" empty-text="暂无合作意向">
          <el-table-column prop="achievementTitle" label="成果" min-width="200" show-overflow-tooltip />
          <el-table-column prop="studentName" label="学生" width="120" />
          <el-table-column prop="message" label="合作说明" min-width="240" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="s"><el-tag :type="s.row.status === '待回复' ? 'warning' : s.row.status === '已接受' ? 'success' : 'info'">{{ s.row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="reply" label="学生回复" min-width="180" show-overflow-tooltip />
          <el-table-column prop="createTime" label="发起时间" width="170" />
        </el-table>
      </el-card>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const list = ref([])
const loading = ref(false)
onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/api/enterprise/intents')
    if (res.code === 200) list.value = res.data || []
  } catch { ElMessage.error('获取合作意向失败') } finally { loading.value = false }
})
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.table-card { border-radius: var(--radius-lg); border: 1px solid var(--border-color); }
</style>
