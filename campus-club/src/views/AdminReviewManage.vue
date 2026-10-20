<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">评审记录管理</h1>
          <p class="page-hero__subtitle">查看所有专家评审记录，监管评审质量</p>
        </div>
      </div>
      <div class="content-card table-card">
        <el-table :data="reviews" v-loading="loading" style="width:100%" empty-text="暂无评审记录">
          <el-table-column prop="id" label="编号" width="70"/>
          <el-table-column prop="achievementTitle" label="成果名称" min-width="160" show-overflow-tooltip/>
          <el-table-column prop="score" label="评分" width="80" align="center"/>
          <el-table-column label="结论" width="90" align="center">
            <template #default="s"><el-tag size="small" :type="conclusionTag(s.row.conclusion)">{{ conclusionText(s.row.conclusion) }}</el-tag></template>
          </el-table-column>
          <el-table-column label="评审类型" width="100" align="center">
            <template #default="s">{{ s.row.reviewType === 'incubation' ? '孵化评审' : '成果评审' }}</template>
          </el-table-column>
          <el-table-column prop="comment" label="评语" min-width="180" show-overflow-tooltip/>
          <el-table-column prop="review_time" label="评审时间" width="170">
            <template #default="s">{{ fmt(s.row.review_time) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const reviews = ref([]), loading = ref(false)

const conclusionText = (c) => ({ excellent: '优秀', good: '良好', pass: '合格', fail: '不合格' }[c] || c || '未设置')
const conclusionTag = (c) => ({ excellent: 'success', good: '', pass: 'warning', fail: 'danger' }[c] || 'info')
const fmt = d => { if(!d)return'';const dt=new Date(d);return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')+' '+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0') }

onMounted(async () => {
  loading.value = true
  try {
    const r = await request.get('/api/admin/reviews')
    if (r.code === 200) reviews.value = r.data || []
  } catch (e) { console.error(e) }
  finally { loading.value = false }
})
</script>

<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xxl) var(--spacing-xxxl); margin-bottom: var(--spacing-xl); color: var(--text-inverse); box-shadow: var(--shadow-lg); }
.page-hero__inner { display: flex; justify-content: space-between; align-items: center; }
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; }
.table-card { border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); overflow: hidden; }
@media (max-width: 768px) { .manage-content { padding: var(--spacing-md); } .page-hero { padding: var(--spacing-xl); } }
</style>
