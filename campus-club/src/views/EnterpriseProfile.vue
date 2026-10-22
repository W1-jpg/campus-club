<template>
  <PageLayout userType="enterprise">
    <div class="view-content">
      <div class="page-hero">
        <h1>企业资料</h1>
        <p>完善企业信息，便于学生了解合作方</p>
      </div>
      <el-card class="form-card" shadow="never" v-loading="loading">
        <el-form :model="form" label-width="100px" label-position="top">
          <el-row :gutter="20">
            <el-col :span="12"><el-form-item label="企业名称"><el-input v-model="form.companyName" placeholder="请输入企业名称" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="联系人"><el-input v-model="form.realName" placeholder="请输入联系人姓名" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="所属行业"><el-input v-model="form.industry" placeholder="例如：互联网、智能制造" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="联系电话"><el-input v-model="form.phone" placeholder="请输入联系电话" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="邮箱"><el-input v-model="form.email" placeholder="请输入邮箱" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item label="企业地址"><el-input v-model="form.address" placeholder="请输入企业地址" /></el-form-item></el-col>
            <el-col :span="24"><el-form-item label="企业简介"><el-input v-model="form.description" type="textarea" :rows="5" maxlength="500" show-word-limit placeholder="介绍企业主营业务、合作方向等" /></el-form-item></el-col>
          </el-row>
          <div class="form-actions"><el-button type="primary" :loading="saving" @click="save">保存资料</el-button></div>
        </el-form>
      </el-card>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const form = ref({ companyName: '', realName: '', industry: '', phone: '', email: '', address: '', description: '' })
const loading = ref(false)
const saving = ref(false)
const load = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/enterprise/profile')
    if (res.code === 200) form.value = { ...form.value, ...res.data }
  } catch { ElMessage.error('获取企业资料失败') } finally { loading.value = false }
}
const save = async () => {
  saving.value = true
  try {
    const res = await request.put('/api/enterprise/profile', form.value)
    if (res.code === 200) ElMessage.success('保存成功')
    else ElMessage.error(res.msg || '保存失败')
  } catch { ElMessage.error('保存失败') } finally { saving.value = false }
}
onMounted(load)
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.form-card { border-radius: var(--radius-lg); border: 1px solid var(--border-color); }
.form-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
</style>
