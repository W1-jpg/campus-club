<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-header">
        <div>
          <h2 class="page-header__title">专家管理</h2>
          <p class="page-header__subtitle">管理评审专家账户，支持多领域专家信息维护</p>
        </div>
        <el-button type="primary" @click="addExpert">
          <el-icon><Plus /></el-icon>添加专家
        </el-button>
      </div>

      <div class="content-card" style="margin-bottom: var(--spacing-lg);">
        <el-input v-model="searchQuery" placeholder="搜索专家姓名、领域、职称或机构" class="search-input" clearable @clear="searchExperts">
          <template #append>
            <el-button type="primary" @click="searchExperts">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="content-card table-card">
        <el-table :data="experts" style="width: 100%" table-layout="fixed" v-loading="loading">
          <el-table-column prop="id" label="编号" width="70" align="center" />
          <el-table-column prop="username" label="用户名" width="110" show-overflow-tooltip />
          <el-table-column prop="real_name" label="姓名" width="90" show-overflow-tooltip />
          <el-table-column prop="phone" label="电话" width="120" show-overflow-tooltip>
            <template #default="scope">{{ scope.row.phone || '—' }}</template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱" width="190" show-overflow-tooltip />
          <el-table-column prop="field" label="研究领域" width="110">
            <template #default="scope">
              <el-tag size="small" effect="light" type="success">{{ scope.row.field || '未设置' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="职称" width="90" show-overflow-tooltip />
          <el-table-column prop="organization" label="所属机构" min-width="150" show-overflow-tooltip />
          <el-table-column prop="create_time" label="创建时间" width="150" :formatter="formatTime" />
          <el-table-column label="操作" width="130" fixed="right" align="center">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="editExpert(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteExpert(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="padding: var(--spacing-lg); display: flex; justify-content: flex-end;">
          <el-pagination
            v-model:current-page="currentPage" v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper"
            :total="total" @size-change="handleSizeChange" @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="550px" :close-on-click-modal="false">
        <el-form :model="form" label-width="90px">
          <el-form-item label="用户名">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" v-if="isAdd">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" />
          </el-form-item>
          <el-form-item label="姓名">
            <el-input v-model="form.real_name" placeholder="请输入真实姓名" />
          </el-form-item>
          <el-form-item label="电话">
            <el-input v-model="form.phone" placeholder="请输入联系电话" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="form.email" placeholder="请输入邮箱地址" />
          </el-form-item>
          <el-form-item label="研究领域">
            <el-select v-model="form.field" placeholder="请选择研究领域" clearable style="width: 100%;">
              <el-option label="计算机科学" value="计算机科学" />
              <el-option label="人工智能" value="人工智能" />
              <el-option label="软件工程" value="软件工程" />
              <el-option label="数据科学" value="数据科学" />
              <el-option label="网络安全" value="网络安全" />
              <el-option label="电子信息" value="电子信息" />
              <el-option label="机械工程" value="机械工程" />
              <el-option label="生物医学" value="生物医学" />
              <el-option label="经济管理" value="经济管理" />
              <el-option label="人文社科" value="人文社科" />
              <el-option label="艺术设计" value="艺术设计" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="职称">
            <el-select v-model="form.title" placeholder="请选择职称" clearable style="width: 100%;">
              <el-option label="教授" value="教授" />
              <el-option label="副教授" value="副教授" />
              <el-option label="研究员" value="研究员" />
              <el-option label="副研究员" value="副研究员" />
              <el-option label="讲师" value="讲师" />
              <el-option label="高级工程师" value="高级工程师" />
              <el-option label="工程师" value="工程师" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="所属机构">
            <el-input v-model="form.organization" placeholder="请输入所属机构" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveExpert">保存</el-button>
        </template>
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

const searchQuery = ref('')
const experts = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isAdd = ref(false)
const form = ref({
  username: '', password: '', real_name: '', phone: '',
  email: '', field: '', title: '', organization: ''
})

onMounted(() => { getExperts() })

const getExperts = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/api/admin/experts', method: 'get',
      params: { page: currentPage.value, pageSize: pageSize.value, search: searchQuery.value }
    })
    if (res.code === 200) { experts.value = res.data.experts; total.value = res.data.total }
    else ElMessage.error(res.msg || '获取专家列表失败')
  } catch { ElMessage.error('获取专家列表失败') }
  finally { loading.value = false }
}

const searchExperts = () => { currentPage.value = 1; getExperts() }

const addExpert = () => {
  dialogTitle.value = '添加专家'; isAdd.value = true
  form.value = { username: '', password: '', real_name: '', phone: '', email: '', field: '', title: '', organization: '' }
  dialogVisible.value = true
}

const editExpert = (row) => {
  dialogTitle.value = '编辑专家'; isAdd.value = false
  form.value = { ...row, password: '' }
  dialogVisible.value = true
}

const saveExpert = async () => {
  if (!form.value.username || (!isAdd.value ? false : !form.value.password) || !form.value.real_name) {
    ElMessage.warning('用户名、密码（添加时）、姓名不能为空')
    return
  }
  try {
    const url = isAdd.value ? '/api/admin/experts' : '/api/admin/experts/' + form.value.id
    const res = await request({ url, method: isAdd.value ? 'post' : 'put', data: form.value })
    if (res.code === 200) { ElMessage.success(isAdd.value ? '添加成功' : '编辑成功'); dialogVisible.value = false; getExperts() }
    else ElMessage.error(res.msg || '操作失败')
  } catch { ElMessage.error('操作失败') }
}

const deleteExpert = async (id) => {
  try { await ElMessageBox.confirm('确定要删除该专家吗？删除后不可恢复。', '确认删除', { type: 'warning' }) }
  catch { return }
  try {
    const res = await request({ url: '/api/admin/experts/' + id, method: 'delete' })
    if (res.code === 200) { ElMessage.success('删除成功'); getExperts() }
    else ElMessage.error(res.msg || '删除失败')
  } catch { ElMessage.error('删除失败') }
}

const formatTime = (row, column, value) => {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

const handleSizeChange = (size) => { pageSize.value = size; getExperts() }
const handleCurrentChange = (current) => { currentPage.value = current; getExperts() }
</script>

<style scoped>
.manage-content {
  width: 100%;
  max-width: var(--content-max-width-wide);
  margin: 0 auto;
  padding: var(--spacing-xl);
  box-sizing: border-box;
}
.search-input { max-width: 420px; }
.table-card { padding: 0; overflow-x: auto; }
.table-card :deep(.el-table) { min-width: 1120px; }
.table-card :deep(.el-table__inner-wrapper) { border-radius: var(--radius-lg); }
.table-card :deep(.el-table th.el-table__cell) { background: #f8fafd; }
</style>
