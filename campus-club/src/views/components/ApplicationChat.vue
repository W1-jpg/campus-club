<template>
  <el-dialog :model-value="visible" :title="dialogTitle" width="620px" @update:model-value="close" @closed="stopPolling">
    <div class="chat-box">
      <div ref="messageListRef" class="chat-messages">
        <div v-for="msg in messages" :key="msg.id" class="chat-item" :class="{ self: msg.senderType === myType }">
          <div class="chat-meta">
            <span>{{ senderLabel(msg.senderType) }}</span>
            <span>{{ formatTime(msg.createTime) }}</span>
          </div>
          <div class="chat-bubble">{{ msg.content }}</div>
        </div>
        <el-empty v-if="messages.length === 0" description="暂无沟通消息，发送第一条吧" :image-size="70" />
      </div>
      <div class="chat-input">
        <el-input
          v-model="content"
          type="textarea"
          :rows="2"
          maxlength="1000"
          show-word-limit
          placeholder="输入沟通内容，Enter 发送"
          @keydown.enter.exact.prevent="send"
        />
        <el-button type="primary" :loading="sending" @click="send">发送</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../../utils/request'

const props = defineProps({
  visible: { type: Boolean, default: false },
  applicationId: { type: [Number, String], default: null },
  title: { type: String, default: '' }
})
const emit = defineEmits(['update:visible'])
const messages = ref([])
const content = ref('')
const sending = ref(false)
const messageListRef = ref(null)
const myType = localStorage.getItem('userType') || 'student'
let timer = null

const dialogTitle = computed(() => props.title ? `沟通：${props.title}` : '申请沟通')
const senderLabel = (type) => ({ student: '学生', enterprise: '企业', admin: '管理员' }[type] || '用户')
const formatTime = (value) => value ? new Date(value).toLocaleString('zh-CN') : ''
const close = (value) => emit('update:visible', value)

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight
}

const load = async () => {
  if (!props.applicationId) return
  try {
    const res = await request.get(`/api/application/${props.applicationId}/messages`)
    if (res.code === 200) {
      messages.value = res.data || []
      await request.put(`/api/application/${props.applicationId}/messages/read`)
      scrollToBottom()
    }
  } catch (e) { /* 聊天加载失败时静默，避免频繁弹窗 */ }
}

const startPolling = () => {
  stopPolling()
  timer = setInterval(load, 5000)
}
const stopPolling = () => {
  if (timer) { clearInterval(timer); timer = null }
}

const send = async () => {
  if (!content.value.trim()) { ElMessage.warning('请输入消息内容'); return }
  if (!props.applicationId) return
  sending.value = true
  try {
    const res = await request.post(`/api/application/${props.applicationId}/messages`, { content: content.value.trim() })
    if (res.code === 200) {
      content.value = ''
      await load()
      scrollToBottom()
    } else {
      ElMessage.error(res.msg || '发送失败')
    }
  } catch { ElMessage.error('发送失败') } finally { sending.value = false }
}

watch(() => props.visible, (show) => {
  if (show) { load(); startPolling() } else { stopPolling() }
})
watch(() => props.applicationId, () => { if (props.visible) load() })
onUnmounted(stopPolling)
</script>

<style scoped>
.chat-box { display: flex; flex-direction: column; gap: 12px; }
.chat-messages { height: 320px; overflow-y: auto; padding: 12px; border-radius: 12px; background: var(--bg-page); border: 1px solid var(--border-color-light); }
.chat-item { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 14px; }
.chat-item.self { align-items: flex-end; }
.chat-meta { display: flex; gap: 8px; margin-bottom: 4px; font-size: 11px; color: var(--text-tertiary); }
.chat-bubble { max-width: 78%; padding: 9px 12px; border-radius: 10px; background: #fff; border: 1px solid var(--border-color-light); color: var(--text-primary); font-size: 13px; line-height: 1.55; word-break: break-word; }
.chat-item.self .chat-bubble { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
.chat-input { display: flex; gap: 10px; align-items: flex-end; }
.chat-input :deep(.el-textarea) { flex: 1; }
</style>
