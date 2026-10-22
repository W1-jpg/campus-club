<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-hero">
        <h1>我的评分记录</h1>
        <p>查看本人已评分的成果、分数和时间</p>
      </div>
      <el-card class="table-card" shadow="never">
        <el-table :data="records" v-loading="loading" empty-text="暂无评分记录">
          <el-table-column prop="id" label="成果编号" width="100" />
          <el-table-column prop="title" label="成果名称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="110" />
          <el-table-column prop="studentName" label="学生" width="130" />
          <el-table-column prop="score" label="评分" width="90" align="center">
            <template #default="s"><b class="score">{{ s.row.score }}</b></template>
          </el-table-column>
          <el-table-column prop="scoreTime" label="评分时间" width="180" />
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

const records = ref([])
const loading = ref(false)
onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/api/teacher/score-records')
    if (res.code === 200) records.value = res.data || []
  } catch { ElMessage.error('获取评分记录失败') }
  finally { loading.value = false }
})
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.table-card { border-radius: var(--radius-lg); }
.score { color: var(--color-primary); font-size: 16px; }
</style>
