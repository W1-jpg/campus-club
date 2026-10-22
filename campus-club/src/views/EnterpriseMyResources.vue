<template>
  <PageLayout userType="enterprise">
    <div class="view-content">
      <div class="page-hero">
        <h1>我的资源</h1>
        <p>查看已投递资源、申请情况和资助明细</p>
      </div>
      <el-card class="table-card" shadow="never">
        <el-table :data="resources" v-loading="loading" empty-text="暂无资源，请先去资源投递">
          <el-table-column prop="title" label="资源名称" min-width="200" show-overflow-tooltip />
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="s"><el-tag :type="s.row.status === 'active' ? 'success' : 'info'">{{ s.row.status === 'active' ? '进行中' : '已下架' }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="applyCount" label="申请数" width="90" align="center" />
          <el-table-column label="累计资助" width="120" align="right">
            <template #default="s"><b class="money">¥{{ money(s.row.receivedAmount) }}</b></template>
          </el-table-column>
          <el-table-column prop="publishTime" label="发布时间" width="180" />
          <el-table-column label="操作" width="180">
            <template #default="s">
              <el-button type="primary" link @click="openDetail(s.row)">资助明细</el-button>
              <el-button v-if="s.row.status === 'active'" type="danger" link @click="offline(s.row)">下架</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog v-model="dialog" :title="`资助明细：${current.title || ''}`" width="760px">
        <div class="total">累计资助 <b>¥{{ money(funding.total) }}</b></div>
        <h4 class="sub-title">申请记录</h4>
        <el-table :data="currentApps" size="small" empty-text="暂无申请">
          <el-table-column prop="studentName" label="学生" width="120" />
          <el-table-column prop="studentCollege" label="学院" width="140" />
          <el-table-column prop="status" label="状态" width="100" />
          <el-table-column prop="applicationTime" label="申请时间" width="170" />
        </el-table>
        <h4 class="sub-title">资助流水</h4>
        <el-table :data="funding.records || []" size="small" empty-text="暂无资助记录">
          <el-table-column prop="enterpriseName" label="资助企业" min-width="140" />
          <el-table-column label="金额" width="110" align="right"><template #default="s">¥{{ money(s.row.amount) }}</template></el-table-column>
          <el-table-column prop="remark" label="用途" min-width="180" show-overflow-tooltip />
          <el-table-column prop="createTime" label="时间" width="170" />
        </el-table>
      </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const resources = ref([])
const applications = ref([])
const loading = ref(false)
const dialog = ref(false)
const current = ref({})
const funding = ref({ total: 0, records: [] })
const currentApps = computed(() => applications.value.filter(a => a.resourceId === current.value.id))
const eid = () => parseInt(localStorage.getItem('enterpriseId') || '0')
const money = v => Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const load = async () => {
  loading.value = true
  try {
    const [r, a] = await Promise.all([
      request.get(`/api/enterprise/resources/${eid()}`),
      request.get(`/api/enterprise/applications/${eid()}`)
    ])
    if (r.code === 200) resources.value = r.data || []
    if (a.code === 200) applications.value = a.data || []
  } catch { ElMessage.error('获取资源失败') } finally { loading.value = false }
}
const openDetail = async (row) => {
  current.value = row
  dialog.value = true
  funding.value = { total: 0, records: [] }
  try {
    const res = await request.get(`/api/expense/resource/${row.id}`)
    if (res.code === 200) funding.value = res.data || { total: 0, records: [] }
  } catch { ElMessage.error('获取资助明细失败') }
}
const offline = async (row) => {
  try { await ElMessageBox.confirm('确定下架该资源吗？', '提示', { type: 'warning' }) } catch { return }
  try {
    const res = await request.delete(`/api/enterprise/resources/${row.id}`)
    if (res.code === 200) { ElMessage.success('已下架'); load() }
  } catch { ElMessage.error('下架失败') }
}
onMounted(load)
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.table-card { border-radius: var(--radius-lg); border: 1px solid var(--border-color); }
.money { color: #10b981; }
.total { padding: 14px 18px; margin-bottom: 16px; border-radius: 12px; background: linear-gradient(135deg,#eef6ff,#f5f0ff); color: var(--text-secondary); }
.total b { font-size: 24px; color: #10b981; margin-left: 8px; }
.sub-title { margin: 18px 0 10px; font-size: 14px; color: var(--text-primary); }
</style>
