<template>
  <PageLayout userType="enterprise">
    <div class="manage-content">
      <div class="page-hero">
        <div class="page-hero__inner">
          <div>
            <h1 class="page-hero__title">申请审批管理</h1>
            <p class="page-hero__subtitle">查看并审批学生发起的资源对接申请</p>
          </div>
        </div>
      </div>

      <div class="filter-row">
        <el-radio-group v-model="filter" size="large">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="待审核">待审核</el-radio-button>
          <el-radio-button value="已通过">已通过</el-radio-button>
          <el-radio-button value="已拒绝">已拒绝</el-radio-button>
        </el-radio-group>
      </div>

      <div class="content-card table-card">
        <el-table :data="filtered" v-loading="loading" style="width:100%" empty-text="暂无申请">
          <el-table-column prop="id" label="编号" width="70"/>
          <el-table-column prop="resourceTitle" label="申请资源" min-width="140" show-overflow-tooltip/>
          <el-table-column prop="achievementTitle" label="关联成果" min-width="150" show-overflow-tooltip/>
          <el-table-column prop="studentName" label="学生" width="90"/>
          <el-table-column prop="studentCollege" label="学院" width="110"/>
          <el-table-column prop="status" label="状态" width="90" align="center"><template #default="s"><el-tag size="small" :type="s.row.status==='待审核'?'warning':s.row.status==='已通过'?'success':'danger'">{{ s.row.status }}</el-tag></template></el-table-column>
          <el-table-column prop="applicationTime" label="申请时间" width="170"><template #default="s">{{ fmt(s.row.applicationTime) }}</template></el-table-column>
          <el-table-column label="申请材料" width="110" align="center">
            <template #default="s"><el-button type="primary" link @click="viewFiles(s.row)">查看材料</el-button></template>
          </el-table-column>
          <el-table-column label="操作" width="190" fixed="right"><template #default="s"><template v-if="s.row.status==='待审核'"><el-button type="success" size="small" @click="approve(s.row)">批准</el-button><el-button type="danger" size="small" @click="reject(s.row)">拒绝</el-button></template><span v-else style="color:var(--text-tertiary)">已处理</span></template></el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="filesVisible" title="学生申请材料" width="700px">
        <div v-if="filesLoading" class="material-loading">正在加载材料...</div>
        <template v-else>
          <div class="material-head">
            <span>成果：{{ filesData.achievementTitle || '未找到已通过评审的成果' }}</span>
            <span>学生：{{ filesData.studentName || '-' }}</span>
          </div>
          <el-table :data="filesData.files || []" empty-text="该学生暂无可查看的成果文件" size="small">
            <el-table-column prop="category" label="阶段" width="90" />
            <el-table-column prop="name" label="文件名" min-width="240" show-overflow-tooltip />
            <el-table-column prop="sizeText" label="大小" width="90" />
            <el-table-column label="操作" width="90">
              <template #default="s"><a v-if="s.row.url" :href="s.row.url" target="_blank" class="file-download">下载</a></template>
            </el-table-column>
          </el-table>
        </template>
        <template #footer><el-button type="primary" @click="filesVisible = false">关闭</el-button></template>
      </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const applications = ref([]), loading = ref(false), filter = ref('all')
const filesVisible = ref(false), filesLoading = ref(false), filesData = ref({})
const eid = () => parseInt(localStorage.getItem('enterpriseId')||'0')
const filtered = computed(() => filter.value==='all'?applications.value:applications.value.filter(a=>a.status===filter.value))

onMounted(() => { load() })

const load = async () => { loading.value=true; try{const r=await request.get('/api/enterprise/applications/'+eid());if(r.code===200)applications.value=r.data||[]}catch{ElMessage.error('获取失败')}finally{loading.value=false} }
const approve = async (row) => { try{await request.put('/api/enterprise/applications/'+row.id+'/status',{status:'已通过'});ElMessage.success('已批准');load()}catch{ElMessage.error('操作失败')} }
const reject = async (row) => { try{await request.put('/api/enterprise/applications/'+row.id+'/status',{status:'已拒绝'});ElMessage.success('已拒绝');load()}catch{ElMessage.error('操作失败')} }
const fmt = d => { if(!d)return'';const dt=new Date(d);return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')+' '+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0') }
const viewFiles = async (row) => {
  filesVisible.value = true
  filesLoading.value = true
  filesData.value = {}
  try {
    const r = await request.get(`/api/enterprise/application/${row.id}/files`)
    if (r.code === 200) filesData.value = r.data || {}
    else ElMessage.error(r.msg || '获取材料失败')
  } catch { ElMessage.error('获取申请材料失败') } finally { filesLoading.value = false }
}
</script>

<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xxl) var(--spacing-xxxl); margin-bottom: var(--spacing-xl); color: var(--text-inverse); box-shadow: var(--shadow-lg); }
.page-hero__inner { display: flex; justify-content: space-between; align-items: center; }
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; }

.filter-row { margin-bottom: var(--spacing-lg); }
.table-card { border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); overflow: hidden; }
.material-head { display: flex; gap: 24px; padding: 12px 14px; margin-bottom: 12px; border-radius: 10px; background: var(--bg-page); color: var(--text-secondary); font-size: 13px; }
.material-loading { padding: 40px; text-align: center; color: var(--text-tertiary); }
.file-download { color: var(--color-primary); text-decoration: none; font-size: 13px; }

@media (max-width: 768px) {
  .manage-content { padding: var(--spacing-md); }
  .page-hero { padding: var(--spacing-xl); }
}
</style>
