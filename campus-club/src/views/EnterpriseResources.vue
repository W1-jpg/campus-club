<template>
  <PageLayout userType="enterprise">
    <div class="manage-content">
      <div class="page-hero">
        <div class="page-hero__inner">
          <div>
            <h1 class="page-hero__title">资源投递管理</h1>
            <p class="page-hero__subtitle">向学校投放资金、设备、导师等扶持资源，查看学生申请情况</p>
          </div>
          <el-button type="primary" size="large" @click="openAdd"><el-icon><Plus /></el-icon>投递新资源</el-button>
        </div>
      </div>

      <div class="content-card table-card">
        <el-table :data="resources" v-loading="loading" style="width:100%" empty-text="暂无投递资源">
          <el-table-column prop="id" label="编号" width="70"/>
          <el-table-column prop="title" label="资源名称" min-width="160" show-overflow-tooltip/>
          <el-table-column prop="type" label="类型" width="110"><template #default="s"><el-tag size="small" :type="typeColor(s.row.type)">{{ s.row.type }}</el-tag></template></el-table-column>
          <el-table-column prop="provider" label="提供方" width="140"/>
          <el-table-column label="申请数" width="90" align="center"><template #default="s"><el-button type="primary" link @click="viewApps(s.row)">{{ s.row.applyCount || 0 }} 人</el-button></template></el-table-column>
          <el-table-column label="累计获得" width="130" align="right">
            <template #default="s">
              <el-button type="success" link @click="viewExpenses(s.row)">¥{{ money(s.row.receivedAmount) }}</el-button>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center"><template #default="s"><el-tag size="small" :type="s.row.status==='active'?'success':'info'">{{ s.row.status==='active'?'进行中':'已下架' }}</el-tag></template></el-table-column>
          <el-table-column label="发布时间" width="160"><template #default="s">{{ fmt(s.row.publishTime) }}</template></el-table-column>
          <el-table-column label="操作" width="100" fixed="right"><template #default="s"><el-button type="danger" size="small" plain @click="removeResource(s.row.id)" v-if="s.row.status==='active'">下架</el-button></template></el-table-column>
        </el-table>
      </div>

      <el-dialog v-model="dlg" title="投递新资源" width="520px" :close-on-click-modal="false">
        <el-form :model="form" label-width="80px" label-position="top">
          <el-form-item label="资源名称" required><el-input v-model="form.title" placeholder="如：华为创新基金" size="large"/></el-form-item>
          <el-form-item label="资源类型" required><el-select v-model="form.type" style="width:100%" size="large"><el-option v-for="t in types" :key="t" :label="t" :value="t"/></el-select></el-form-item>
          <el-form-item label="提供方"><el-input v-model="form.provider" placeholder="企业或部门名称" size="large"/></el-form-item>
          <el-row :gutter="14">
            <el-col :span="12"><el-form-item label="发布时间"><el-date-picker v-model="form.publishTime" type="datetime" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" size="large"/></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="截止时间"><el-date-picker v-model="form.endTime" type="datetime" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" size="large" :disabled="form.unlimited" placeholder="选择日期"/><el-checkbox v-model="form.unlimited" style="margin-top:6px;font-size:12px">无限期</el-checkbox></el-form-item></el-col>
          </el-row>
          <el-form-item label="资源描述"><el-input v-model="form.description" type="textarea" :rows="4" placeholder="描述资源内容、申请条件等"/></el-form-item>
        </el-form>
        <template #footer><el-button @click="dlg=false">取消</el-button><el-button type="primary" :loading="saving" @click="save">确认投递</el-button></template>
      </el-dialog>

      <el-dialog v-model="appDlg" :title="'申请列表：'+curResource.title" width="750px">
        <el-table :data="applications" empty-text="暂无申请">
          <el-table-column prop="studentName" label="学生" width="100"/>
          <el-table-column prop="achievementTitle" label="关联成果" min-width="150" show-overflow-tooltip/>
          <el-table-column prop="studentCollege" label="学院" width="100"/>
          <el-table-column prop="status" label="状态" width="90"><template #default="s"><el-tag size="small" :type="s.row.status==='待审核'?'warning':s.row.status==='已通过'?'success':'danger'">{{ s.row.status }}</el-tag></template></el-table-column>
          <el-table-column prop="applicationTime" label="申请时间" width="160"><template #default="s">{{ fmt(s.row.applicationTime) }}</template></el-table-column>
          <el-table-column label="操作" width="170" fixed="right"><template #default="s"><template v-if="s.row.status==='待审核'"><el-button type="success" size="small" @click="approve(s.row)">批准</el-button><el-button type="danger" size="small" @click="reject(s.row)">拒绝</el-button></template><span v-else style="color:var(--text-tertiary)">已处理</span></template></el-table-column>
        </el-table>
      </el-dialog>

      <el-dialog v-model="expenseDlg" :title="`资助明细：${curExpenseResource.title || ''}`" width="700px">
        <div class="expense-total">
          <span>累计获得资助</span>
          <b>¥{{ money(expenseTotal) }}</b>
        </div>
        <el-table :data="expenseRecords" empty-text="暂无资助记录">
          <el-table-column prop="enterpriseName" label="资助企业" min-width="160" show-overflow-tooltip />
          <el-table-column label="金额" width="120" align="right">
            <template #default="s">¥{{ money(s.row.amount) }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="用途" min-width="200" show-overflow-tooltip />
          <el-table-column label="时间" width="160">
            <template #default="s">{{ fmt(s.row.createTime) }}</template>
          </el-table-column>
        </el-table>
      </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const resources = ref([]), applications = ref([]), loading = ref(false), dlg = ref(false), appDlg = ref(false), saving = ref(false), curResource = ref({})
const expenseDlg = ref(false), expenseRecords = ref([]), expenseTotal = ref(0), curExpenseResource = ref({})
const form = ref({ title:'',type:'',provider:'',publishTime:'',endTime:'',description:'',unlimited:false })
const types = ['资金支持','设备支持','导师指导','场地提供','技术合作','实习机会','其他']
const eid = () => parseInt(localStorage.getItem('enterpriseId')||'0')

onMounted(() => { loadResources() })

const loadResources = async () => { loading.value=true; try { const r=await request.get('/api/enterprise/resources/'+eid()); if(r.code===200) resources.value=r.data } catch{} finally{loading.value=false} }
const openAdd = () => { form.value={ title:'',type:'',provider:'',publishTime:new Date().toISOString().replace('T',' ').slice(0,19),endTime:'',description:'',unlimited:false }; dlg.value=true }
const save = async () => { if(!form.value.title||!form.value.type){ElMessage.warning('请填写名称和类型');return} saving.value=true; try{const data={enterpriseId:eid(),...form.value};if(data.unlimited)data.endTime=null;const r=await request.post('/api/enterprise/resources',data);if(r.code===200){ElMessage.success('投递成功');dlg.value=false;loadResources()}else ElMessage.error(r.msg)}catch{ElMessage.error('投递失败')}finally{saving.value=false} }
const removeResource = async (id) => { try{await ElMessageBox.confirm('确定下架该资源？','确认',{type:'warning'})}catch{return}; try{await request.delete('/api/enterprise/resources/'+id);ElMessage.success('已下架');loadResources()}catch{ElMessage.error('下架失败')} }
const viewApps = async (row) => { curResource.value=row; try{const r=await request.get('/api/enterprise/applications/'+eid());applications.value=(r.data||[]).filter(a=>a.resourceId===row.id)}catch{ElMessage.error('获取失败')}; appDlg.value=true }
const approve = async (row) => { try{await request.put('/api/enterprise/applications/'+row.id+'/status',{status:'已通过'});ElMessage.success('已批准');viewApps(curResource.value);loadResources()}catch{ElMessage.error('操作失败')} }
const reject = async (row) => { try{await request.put('/api/enterprise/applications/'+row.id+'/status',{status:'已拒绝'});ElMessage.success('已拒绝');viewApps(curResource.value);loadResources()}catch{ElMessage.error('操作失败')} }
const money = (v) => Number(v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const viewExpenses = async (row) => {
  curExpenseResource.value = row
  expenseDlg.value = true
  expenseRecords.value = []
  expenseTotal.value = 0
  try {
    const r = await request.get(`/api/expense/resource/${row.id}`)
    if (r.code === 200) {
      expenseRecords.value = r.data.records || []
      expenseTotal.value = r.data.total || 0
    }
  } catch (e) {
    ElMessage.error(e.msg || '获取资助明细失败')
  }
}
const typeColor = t => ({'资金支持':'danger','设备支持':'warning','导师指导':'success','场地提供':'','技术合作':'primary','实习机会':'info'}[t]||'')
const fmt = d => { if(!d)return'';const dt=new Date(d);return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')+' '+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0') }
</script>

<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xxl) var(--spacing-xxxl); margin-bottom: var(--spacing-xl); color: var(--text-inverse); box-shadow: var(--shadow-lg); }
.page-hero__inner { display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-xl); }
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; }

.table-card { border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); overflow: hidden; }
.expense-total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14px;
  padding: 14px 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, #eef6ff, #f5f0ff);
  color: var(--text-secondary);
  font-size: 14px;
}
.expense-total b { font-size: 24px; color: #10b981; font-variant-numeric: tabular-nums; }

@media (max-width: 768px) {
  .manage-content { padding: var(--spacing-md); }
  .page-hero { padding: var(--spacing-xl); }
  .page-hero__inner { flex-direction: column; align-items: flex-start; }
}
</style>
