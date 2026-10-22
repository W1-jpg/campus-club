<template>
  <PageLayout userType="enterprise">
    <div class="view-content">
      <div class="page-hero">
        <h1>投入统计</h1>
        <p>企业资源投入、资助金额与合作学生统计</p>
      </div>
      <div class="stat-grid">
        <el-card shadow="never"><div class="stat"><span>累计投入</span><b>¥{{ money(stats.totalAmount) }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>资助资源</span><b>{{ stats.fundedResources || 0 }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>发布资源</span><b>{{ stats.resourceCount || 0 }}</b></div></el-card>
        <el-card shadow="never"><div class="stat"><span>合作学生</span><b>{{ stats.studentCount || 0 }}</b></div></el-card>
      </div>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never" header="按资源类型投入">
            <el-table :data="stats.typeDist || []" size="small" empty-text="暂无投入数据">
              <el-table-column prop="name" label="资源类型" />
              <el-table-column label="金额" width="140" align="right"><template #default="s">¥{{ money(s.row.value) }}</template></el-table-column>
            </el-table>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card shadow="never" header="月度投入">
            <el-table :data="stats.monthly || []" size="small" empty-text="暂无投入数据">
              <el-table-column prop="month" label="月份" />
              <el-table-column label="金额" width="140" align="right"><template #default="s">¥{{ money(s.row.value) }}</template></el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
      <el-card shadow="never" header="投入最多的资源" style="margin-top: 20px">
        <el-table :data="stats.topResources || []" empty-text="暂无投入数据">
          <el-table-column prop="title" label="资源名称" />
          <el-table-column label="累计投入" width="160" align="right"><template #default="s">¥{{ money(s.row.amount) }}</template></el-table-column>
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

const stats = ref({})
const money = v => Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
onMounted(async () => {
  try {
    const res = await request.get('/api/enterprise/investment-stats')
    if (res.code === 200) stats.value = res.data || {}
  } catch { ElMessage.error('获取投入统计失败') }
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
.stat b { font-size: 26px; color: var(--color-primary); }
@media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
