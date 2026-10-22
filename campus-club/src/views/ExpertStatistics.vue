<template>
  <PageLayout userType="expert">
    <div class="view-content">
      <div class="page-hero">
        <h1>评审统计</h1>
        <p>个人评审工作量、评分情况与维度分析</p>
      </div>
      <div class="stat-grid">
        <el-card shadow="never"><div class="stat"><span>待评审任务</span><b>{{ stats.pendingCount || 0 }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>已完成评审</span><b>{{ stats.totalReviews || 0 }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>平均评分</span><b>{{ stats.avgScore || '0.0' }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>优秀评价</span><b>{{ stats.excellentCount || 0 }}</b></div></el-card>
      </div>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" header="各维度平均分">
            <el-table :data="dimensionAvg" size="small" empty-text="暂无维度数据">
              <el-table-column prop="name" label="维度" />
              <el-table-column prop="avg" label="平均分" width="100" />
              <el-table-column label="分布" min-width="160">
                <template #default="s"><el-progress :percentage="Math.min(Number(s.row.avg) || 0, 100)" :show-text="false" /></template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" header="最近评审">
            <el-table :data="reviews.slice(0, 8)" size="small" empty-text="暂无评审记录">
              <el-table-column prop="achievementTitle" label="成果" show-overflow-tooltip />
              <el-table-column prop="score" label="分数" width="70" />
              <el-table-column prop="review_time" label="时间" width="160" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const stats = ref({})
const reviews = ref([])
const dimensionMap = ref({})
const dimensionAvg = computed(() => Object.values(dimensionMap.value))

const parseDims = (raw) => {
  if (!raw) return []
  try { const arr = JSON.parse(raw); return Array.isArray(arr) ? arr : [] } catch { return [] }
}
onMounted(async () => {
  const expertId = localStorage.getItem('expertId') || 1
  try {
    const statRes = await request.get(`/api/expert/statistics/${expertId}`)
    if (statRes.code === 200) stats.value = statRes.data || {}
    const reviewRes = await request.get(`/api/expert/reviews/${expertId}`)
    if (reviewRes.code === 200) {
      reviews.value = reviewRes.data || []
      const map = {}
      reviews.value.forEach(r => parseDims(r.dimension_scores).forEach(d => {
        if (!map[d.name]) map[d.name] = { name: d.name, total: 0, count: 0, avg: 0 }
        map[d.name].total += Number(d.score) || 0
        map[d.name].count += 1
      }))
      Object.values(map).forEach(item => { item.avg = Math.round(item.total / item.count * 10) / 10 })
      dimensionMap.value = map
    }
  } catch { ElMessage.error('获取评审统计失败') }
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
@media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
