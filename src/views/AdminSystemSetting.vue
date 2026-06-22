<template>
  <PageLayout userType="admin">
    <div class="manage-content">
      <div class="page-header">
        <div>
          <h2 class="page-header__title">系统设置</h2>
          <p class="page-header__subtitle">配置系统参数与运行环境</p>
        </div>
      </div>

      <div class="setting-grid">
        <el-card class="setting-card" shadow="hover">
          <template #header><div class="card-title"><el-icon :size="18"><Setting /></el-icon> 系统基本设置</div></template>
          <el-form :model="systemSettings" label-width="100px">
            <el-form-item label="系统名称"><el-input v-model="systemSettings.systemName" /></el-form-item>
            <el-form-item label="系统版本"><el-input v-model="systemSettings.systemVersion" /></el-form-item>
            <el-form-item label="系统描述"><el-input v-model="systemSettings.systemDescription" type="textarea" rows="3" /></el-form-item>
            <el-form-item label="联系邮箱"><el-input v-model="systemSettings.contactEmail" /></el-form-item>
            <el-form-item label="联系电话"><el-input v-model="systemSettings.contactPhone" /></el-form-item>
            <el-form-item><el-button type="primary" @click="saveSystemSettings">保存设置</el-button></el-form-item>
          </el-form>
        </el-card>

        <el-card class="setting-card" shadow="hover">
          <template #header><div class="card-title"><el-icon :size="18"><Monitor /></el-icon> 数据库设置</div></template>
          <el-form :model="databaseSettings" label-width="100px">
            <el-form-item label="主机地址"><el-input v-model="databaseSettings.host" /></el-form-item>
            <el-form-item label="端口"><el-input v-model="databaseSettings.port" /></el-form-item>
            <el-form-item label="数据库名"><el-input v-model="databaseSettings.database" /></el-form-item>
            <el-form-item label="用户名"><el-input v-model="databaseSettings.username" /></el-form-item>
            <el-form-item label="密码"><el-input v-model="databaseSettings.password" type="password" /></el-form-item>
            <el-form-item><el-button type="primary" @click="saveDatabaseSettings">保存设置</el-button></el-form-item>
          </el-form>
        </el-card>

        <el-card class="setting-card" shadow="hover">
          <template #header><div class="card-title"><el-icon :size="18"><FolderOpened /></el-icon> 文件上传设置</div></template>
          <el-form :model="fileSettings" label-width="110px">
            <el-form-item label="上传目录"><el-input v-model="fileSettings.uploadDir" /></el-form-item>
            <el-form-item label="最大文件大小"><el-input v-model="fileSettings.maxFileSize"><template #append>MB</template></el-input></el-form-item>
            <el-form-item label="允许文件类型"><el-input v-model="fileSettings.allowedFileTypes" /></el-form-item>
            <el-form-item><el-button type="primary" @click="saveFileSettings">保存设置</el-button></el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Setting, Monitor, FolderOpened } from '@element-plus/icons-vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const systemSettings = ref({ systemName: '', systemVersion: '', systemDescription: '', contactEmail: '', contactPhone: '' })
const databaseSettings = ref({ host: '', port: '', database: '', username: '', password: '' })
const fileSettings = ref({ uploadDir: '', maxFileSize: '', allowedFileTypes: '' })

onMounted(() => { loadSettings() })

const loadSettings = async () => {
  try {
    const [sysRes, dbRes, fileRes] = await Promise.all([
      request({ url: '/api/admin/system-settings' }),
      request({ url: '/api/admin/database-settings' }),
      request({ url: '/api/admin/file-settings' })
    ])
    if (sysRes.code === 200) systemSettings.value = sysRes.data
    if (dbRes.code === 200) databaseSettings.value = dbRes.data
    if (fileRes.code === 200) fileSettings.value = fileRes.data
  } catch { ElMessage.error('获取设置失败') }
}

const saveSystemSettings = async () => { try { const res = await request({ url: '/api/admin/system-settings', method: 'put', data: systemSettings.value }); if (res.code === 200) ElMessage.success('保存成功') } catch { ElMessage.error('保存失败') } }
const saveDatabaseSettings = async () => { try { const res = await request({ url: '/api/admin/database-settings', method: 'put', data: databaseSettings.value }); if (res.code === 200) ElMessage.success('保存成功') } catch { ElMessage.error('保存失败') } }
const saveFileSettings = async () => { try { const res = await request({ url: '/api/admin/file-settings', method: 'put', data: fileSettings.value }); if (res.code === 200) ElMessage.success('保存成功') } catch { ElMessage.error('保存失败') } }
</script>

<style scoped>
.manage-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.setting-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: var(--spacing-xl); }
.card-title { display: flex; align-items: center; gap: var(--spacing-sm); font-weight: 600; font-size: var(--font-size-lg); color: var(--text-primary); }
.setting-card { border-radius: var(--radius-lg); }
</style>
