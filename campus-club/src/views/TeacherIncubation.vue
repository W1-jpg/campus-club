<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-hero">
        <h1>孵化跟踪</h1>
        <p>查看本学院进入孵化阶段的成果及进度</p>
      </div>
      <el-card class="table-card" shadow="never">
        <el-table :data="list" v-loading="loading" empty-text="暂无孵化项目">
          <el-table-column prop="title" label="成果名称" min-width="220" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="110" />
          <el-table-column prop="studentName" label="学生" width="130" />
          <el-table-column prop="score" label="阶段评分" width="100" align="center" />
          <el-table-column prop="incubationScore" label="孵化评分" width="100" align="center" />
          <el-table-column label="孵化状态" width="120">
            <template #default="s">
              <el-tag :type="statusType(s.row.incubationStatus)">{{ statusText(s.row.incubationStatus) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="180" />
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
const statusText = (s) => ({ 1: '孵化中', 2: '已完成', 3: '已打回' }[s] || '未开始')
const statusType = (s) => ({ 1: 'warning', 2: 'success', 3: 'danger' }[s] || 'info')
onMounted(async () => {
  loading.value = true
  try {
    const res = await request.get('/api/teacher/incubation')
    if (res.code === 200) list.value = res.data || []
  } catch { ElMessage.error('获取孵化项目失败') }
  finally { loading.value = false }
})
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.table-card { border-radius: var(--radius-lg); }
</style>
