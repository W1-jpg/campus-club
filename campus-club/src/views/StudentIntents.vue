<template>
  <PageLayout userType="student">
    <div class="view-content">
      <div class="page-hero">
        <h1>合作意向</h1>
        <p>查看企业发起的合作邀请并回复</p>
      </div>
      <el-card class="table-card" shadow="never">
        <el-table :data="list" v-loading="loading" empty-text="暂无合作意向">
          <el-table-column prop="enterpriseName" label="企业" width="150" />
          <el-table-column prop="achievementTitle" label="成果" min-width="200" show-overflow-tooltip />
          <el-table-column prop="message" label="合作说明" min-width="240" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="s"><el-tag :type="s.row.status === '待回复' ? 'warning' : s.row.status === '已接受' ? 'success' : 'info'">{{ s.row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="reply" label="我的回复" min-width="160" show-overflow-tooltip />
          <el-table-column prop="createTime" label="时间" width="170" />
          <el-table-column label="操作" width="110">
            <template #default="s"><el-button v-if="s.row.status === '待回复'" type="primary" link @click="openReply(s.row)">回复</el-button></template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog v-model="dialog" title="回复合作意向" width="500px">
        <el-form label-width="90px">
          <el-form-item label="合作企业">{{ current.enterpriseName }}</el-form-item>
          <el-form-item label="合作说明"><div class="msg">{{ current.message }}</div></el-form-item>
          <el-form-item label="回复">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="接受合作" value="已接受" />
              <el-option label="拒绝合作" value="已拒绝" />
            </el-select>
          </el-form-item>
          <el-form-item label="补充说明"><el-input v-model="form.reply" type="textarea" :rows="3" placeholder="可填写联系方式或说明" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialog = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="submit">提交</el-button>
        </template>
      </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const list = ref([])
const loading = ref(false)
const dialog = ref(false)
const saving = ref(false)
const current = ref({})
const form = ref({ status: '已接受', reply: '' })
const load = async () => {
  loading.value = true
  try { const res = await request.get('/api/student/intents'); if (res.code === 200) list.value = res.data || [] } catch { ElMessage.error('获取合作意向失败') } finally { loading.value = false }
}
const openReply = (row) => { current.value = row; form.value = { status: '已接受', reply: '' }; dialog.value = true }
const submit = async () => {
  saving.value = true
  try {
    const res = await request.put(`/api/student/intents/${current.value.id}/reply`, form.value)
    if (res.code === 200) { ElMessage.success('回复成功'); dialog.value = false; load() } else ElMessage.error(res.msg || '回复失败')
  } catch { ElMessage.error('回复失败') } finally { saving.value = false }
}
onMounted(load)
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.table-card { border-radius: var(--radius-lg); border: 1px solid var(--border-color); }
.msg { color: var(--text-secondary); line-height: 1.6; }
</style>
