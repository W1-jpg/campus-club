<template>
  <PageLayout userType="expert">
    <div class="view-content">
      <div class="page-hero">
        <h1>评审申诉 / 复核</h1>
        <p>查看学生对评审结果的复核申请并给出处理意见</p>
      </div>
      <el-card shadow="never">
        <el-table :data="appeals" v-loading="loading" empty-text="暂无复核申请">
          <el-table-column prop="achievementTitle" label="成果" min-width="220" show-overflow-tooltip />
          <el-table-column prop="studentName" label="学生" width="120" />
          <el-table-column prop="reason" label="申诉理由" min-width="280" show-overflow-tooltip />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="s"><el-tag :type="s.row.status === '待处理' ? 'warning' : s.row.status === '已受理' ? 'success' : 'info'">{{ s.row.status }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="createTime" label="申请时间" width="170" />
          <el-table-column label="操作" width="110">
            <template #default="s"><el-button type="primary" link @click="openReply(s.row)">处理</el-button></template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-dialog v-model="dialog" title="处理复核申请" width="520px">
        <el-form label-width="90px">
          <el-form-item label="学生理由"><div class="reason">{{ current.reason }}</div></el-form-item>
          <el-form-item label="处理结果">
            <el-select v-model="form.status" style="width: 100%">
              <el-option label="已受理" value="已受理" />
              <el-option label="已驳回" value="已驳回" />
            </el-select>
          </el-form-item>
          <el-form-item label="复核意见">
            <el-input v-model="form.reply" type="textarea" :rows="4" placeholder="填写复核意见" />
          </el-form-item>
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

const appeals = ref([])
const loading = ref(false)
const dialog = ref(false)
const saving = ref(false)
const current = ref({})
const form = ref({ status: '已受理', reply: '' })

const load = async () => {
  loading.value = true
  try { const res = await request.get('/api/expert/appeals'); if (res.code === 200) appeals.value = res.data || [] } catch { ElMessage.error('获取复核申请失败') } finally { loading.value = false }
}
const openReply = (row) => { current.value = row; form.value = { status: row.status === '待处理' ? '已受理' : row.status, reply: row.reply || '' }; dialog.value = true }
const submit = async () => {
  if (!form.value.reply.trim()) { ElMessage.warning('请填写复核意见'); return }
  saving.value = true
  try {
    const res = await request.put(`/api/expert/appeals/${current.value.id}/reply`, form.value)
    if (res.code === 200) { ElMessage.success('处理成功'); dialog.value = false; load() } else ElMessage.error(res.msg || '处理失败')
  } catch { ElMessage.error('处理失败') } finally { saving.value = false }
}
onMounted(load)
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); color: var(--text-inverse); border-radius: var(--radius-xl); padding: var(--spacing-xl); margin-bottom: var(--spacing-lg); }
.page-hero h1 { margin: 0 0 6px; font-size: var(--font-size-title); }
.page-hero p { margin: 0; opacity: .8; }
.reason { color: var(--text-secondary); line-height: 1.6; }
</style>
