<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-header">
        <div>
          <h2 class="page-header__title">学生管理</h2>
          <p class="page-header__subtitle">管理系统中的所有学生账户</p>
        </div>
        <el-button type="primary" @click="addStudent">
          <el-icon><Plus /></el-icon>添加学生
        </el-button>
      </div>

      <div class="content-card" style="margin-bottom: var(--spacing-lg);">
        <el-input v-model="searchQuery" placeholder="搜索学生姓名、学号或学院" class="search-input" clearable @clear="searchStudents">
          <template #append>
            <el-button type="primary" @click="searchStudents">搜索</el-button>
          </template>
        </el-input>
      </div>

      <div class="content-card" style="padding: 0; overflow: hidden;">
        <el-table :data="students" style="width: 100%" v-loading="loading">
          <el-table-column prop="id" label="学号" width="100" />
          <el-table-column prop="username" label="用户名" width="150" />
          <el-table-column prop="real_name" label="姓名" width="120" />
          <el-table-column prop="phone" label="电话" width="150" />
          <el-table-column prop="email" label="邮箱" width="200" />
          <el-table-column prop="college" label="学院" width="150" />
          <el-table-column prop="create_time" label="创建时间" width="170" />
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" link @click="editStudent(scope.row)">编辑</el-button>
              <el-button type="danger" size="small" link @click="deleteStudent(scope.row.id)">删除</el-button>
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

      <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" :close-on-click-modal="false">
        <el-form :model="form" label-width="80px">
          <el-form-item label="学号"><el-input v-model="form.id" :disabled="!isAdd" /></el-form-item>
          <el-form-item label="用户名"><el-input v-model="form.username" /></el-form-item>
          <el-form-item label="密码" v-if="isAdd"><el-input v-model="form.password" type="password" /></el-form-item>
          <el-form-item label="姓名"><el-input v-model="form.real_name" /></el-form-item>
          <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="form.email" /></el-form-item>
          <el-form-item label="学院"><el-input v-model="form.college" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveStudent">保存</el-button>
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
const students = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isAdd = ref(false)
const form = ref({ id: '', username: '', password: '', real_name: '', phone: '', email: '', college: '' })

onMounted(() => { getStudents() })

const getStudents = async () => {
  loading.value = true
  try {
    const res = await request({ url: '/api/admin/students', method: 'get', params: { page: currentPage.value, pageSize: pageSize.value, search: searchQuery.value } })
    if (res.code === 200) { students.value = res.data.students; total.value = res.data.total }
    else ElMessage.error(res.msg || '获取学生列表失败')
  } catch { ElMessage.error('获取学生列表失败') }
  finally { loading.value = false }
}

const searchStudents = () => { currentPage.value = 1; getStudents() }

const addStudent = () => {
  dialogTitle.value = '添加学生'; isAdd.value = true
  form.value = { id: '', username: '', password: '', real_name: '', phone: '', email: '', college: '' }
  dialogVisible.value = true
}

const editStudent = (row) => {
  dialogTitle.value = '编辑学生'; isAdd.value = false
  form.value = { ...row }
  dialogVisible.value = true
}

const saveStudent = async () => {
  try {
    const url = isAdd.value ? '/api/admin/students' : '/api/admin/students/' + form.value.id
    const res = await request({ url, method: isAdd.value ? 'post' : 'put', data: form.value })
    if (res.code === 200) { ElMessage.success(isAdd.value ? '添加成功' : '编辑成功'); dialogVisible.value = false; getStudents() }
    else ElMessage.error(res.msg || '操作失败')
  } catch { ElMessage.error('操作失败') }
}

const deleteStudent = async (id) => {
  try { await ElMessageBox.confirm('确定要删除该学生吗？', '确认删除', { type: 'warning' }) }
  catch { return }
  try {
    const res = await request({ url: '/api/admin/students/' + id, method: 'delete' })
    if (res.code === 200) { ElMessage.success('删除成功'); getStudents() }
    else ElMessage.error(res.msg || '删除失败')
  } catch { ElMessage.error('删除失败') }
}

const handleSizeChange = (size) => { pageSize.value = size; getStudents() }
const handleCurrentChange = (current) => { currentPage.value = current; getStudents() }
</script>

<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.search-input { max-width: 420px; }
</style>
