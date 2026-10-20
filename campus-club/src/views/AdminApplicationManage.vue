<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">资源申请管理</h1>
          <p class="page-hero__subtitle">查看所有学生资源对接申请记录</p>
        </div>
      </div>
      <div class="content-card table-card">
        <el-table :data="applications" v-loading="loading" style="width:100%" empty-text="暂无申请记录">
          <el-table-column prop="id" label="编号" width="70"/>
          <el-table-column prop="resourceTitle" label="申请资源" min-width="140" show-overflow-tooltip/>
          <el-table-column prop="studentName" label="学生" width="100"/>
          <el-table-column prop="studentCollege" label="学院" width="110"/>
          <el-table-column label="状态" width="90" align="center">
            <template #default="s"><el-tag size="small" :type="s.row.status==='待审核'?'warning':s.row.status==='已通过'?'success':'danger'">{{ s.row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="applicationTime" label="申请时间" width="170">
            <template #default="s">{{ fmt(s.row.applicationTime) }}</template>
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

const applications = ref([]), loading = ref(false)
const fmt = d => { if(!d)return'';const dt=new Date(d);return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')+' '+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0') }

onMounted(async () => {
  loading.value = true
  try {
    const r = await request.get('/api/admin/applications')
    if (r.code === 200) applications.value = r.data || []
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
