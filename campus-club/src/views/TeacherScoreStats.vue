<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-hero">
        <h1>评分统计</h1>
        <p>本学院成果评分进度与分数分布</p>
      </div>
      <div class="stat-grid">
        <el-card shadow="never"><div class="stat"><span>成果总数</span><b>{{ stats.total || 0 }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>已评分</span><b>{{ stats.scored || 0 }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>待评分</span><b>{{ stats.pending || 0 }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>平均分</span><b>{{ stats.averageScore || 0 }}</b></div></el-card>
      </div>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" header="分数段分布">
            <div v-for="item in stats.distribution || []" :key="item.name" class="bar-row">
              <span class="bar-label">{{ item.name }}</span>
              <el-progress :percentage="percent(item.value)" :show-text="false" />
              <span class="bar-value">{{ item.value }}</span>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" header="月度评分趋势">
            <el-table :data="stats.monthly || []" size="small" empty-text="暂无数据">
              <el-table-column prop="month" label="月份" />
              <el-table-column prop="value" label="成果数" />
              <el-table-column prop="avgScore" label="平均分" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const stats = ref({})
const maxValue = computed(() => Math.max(...(stats.value.distribution || []).map(i => Number(i.value) || 0), 1))
const percent = (value) => Math.round((Number(value) || 0) / maxValue.value * 100)
onMounted(async () => {
  try {
    const res = await request.get('/api/teacher/score-stats')
    if (res.code === 200) stats.value = res.data || {}
  } catch { ElMessage.error('获取统计失败') }
})
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.stat { display: flex; flex-direction: column; gap: 8px; }
.stat span { color: var(--text-tertiary); font-size: 13px; }
.stat b { font-size: 28px; color: var(--color-primary); }
.bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.bar-label { width: 90px; font-size: 13px; color: var(--text-secondary); }
.bar-row :deep(.el-progress) { flex: 1; }
.bar-value { width: 36px; text-align: right; font-size: 13px; }
@media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
