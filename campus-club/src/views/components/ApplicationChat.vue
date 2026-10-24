<template>
  <el-dialog :model-value="visible" :title="dialogTitle" width="620px" @update:model-value="close" @closed="stopPolling">
    <div class="chat-box">
      <div ref="messageListRef" class="chat-messages">
        <div v-for="msg in messages" :key="msg.id" class="chat-item" :class="{ self: msg.senderType === myType }">
          <div class="chat-meta">
            <span>{{ senderLabel(msg.senderType) }}</span>
            <span>{{ formatTime(msg.createTime) }}</span>
          </div>
          <div v-if="isVoice(msg)" class="chat-bubble voice-bubble">
            <audio :src="msg.audioUrl" controls preload="none"></audio>
            <span class="voice-duration">{{ msg.duration || 0 }}″</span>
          </div>
          <div v-else class="chat-bubble">{{ msg.content }}</div>
        </div>
        <el-empty v-if="messages.length === 0" description="暂无沟通消息，发送第一条吧" :image-size="70" />
      </div>
      <div class="chat-input">
        <el-button
          class="voice-btn"
          :type="recording ? 'danger' : 'default'"
          circle
          :disabled="uploadingVoice"
          title="按住说话"
          @click="toggleRecording"
        >{{ recording ? '■' : '🎙️' }}</el-button>
        <template v-if="recording">
          <div class="recording-bar">
            <span class="rec-dot"></span>
            录音中 {{ recordSeconds }}s / 60s
          </div>
          <el-button size="small" @click="cancelRecording">取消</el-button>
        </template>
        <template v-else>
          <el-input
            v-model="content"
            type="textarea"
            :rows="2"
            maxlength="1000"
            show-word-limit
            placeholder="输入沟通内容，Enter 发送；也可以点左侧麦克风发语音"
            @keydown.enter.exact.prevent="send"
          />
          <el-button type="primary" :loading="sending" :disabled="uploadingVoice" @click="send">发送</el-button>
        </template>
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
const emit = defineEmits(['update:visible', 'read'])
const messages = ref([])
const content = ref('')
const sending = ref(false)
const messageListRef = ref(null)
const myType = localStorage.getItem('userType') || 'student'
let timer = null
const recording = ref(false)
const recordSeconds = ref(0)
const uploadingVoice = ref(false)
let mediaRecorder = null
let recordStream = null
let recordChunks = []
let recordTimer = null
let discardRecording = false

const dialogTitle = computed(() => props.title ? `沟通：${props.title}` : '申请沟通')
const senderLabel = (type) => ({ student: '学生', enterprise: '企业', admin: '管理员' }[type] || '用户')
const formatTime = (value) => value ? new Date(value).toLocaleString('zh-CN') : ''
const isVoice = (msg) => msg.messageType === 'voice' || !!msg.audioUrl
const close = (value) => {
  if (recording.value) cancelRecording()
  emit('update:visible', value)
}

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
      emit('read', props.applicationId)
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

const cleanupRecording = () => {
  if (recordTimer) { clearInterval(recordTimer); recordTimer = null }
  if (recordStream) {
    recordStream.getTracks().forEach(track => track.stop())
    recordStream = null
  }
  mediaRecorder = null
  recordChunks = []
  recording.value = false
  recordSeconds.value = 0
}

const uploadVoice = async () => {
  const duration = Math.min(Math.max(recordSeconds.value, 1), 60)
  const mime = mediaRecorder?.mimeType || 'audio/webm'
  const blob = new Blob(recordChunks, { type: mime })
  const wasDiscarded = discardRecording
  cleanupRecording()
  if (wasDiscarded) return
  if (blob.size === 0) { ElMessage.warning('没有录到声音，请重试'); return }

  let ext = 'webm'
  if (mime.includes('ogg')) ext = 'ogg'
  else if (mime.includes('mp4')) ext = 'mp4'
  else if (mime.includes('mpeg')) ext = 'mp3'
  const fd = new FormData()
  fd.append('file', blob, `voice-${Date.now()}.${ext}`)
  fd.append('duration', String(duration))
  uploadingVoice.value = true
  try {
    const res = await request.post(`/api/application/${props.applicationId}/messages/voice`, fd)
    if (res.code === 200) {
      ElMessage.success('语音已发送')
      await load()
      scrollToBottom()
    } else {
      ElMessage.error(res.msg || '语音发送失败')
    }
  } catch { ElMessage.error('语音发送失败') } finally { uploadingVoice.value = false }
}

const startRecording = async () => {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    ElMessage.warning('当前浏览器不支持录音，请使用 Chrome/Edge，或通过 HTTPS 访问')
    return
  }
  try {
    recordStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
    const mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type)) || ''
    mediaRecorder = mimeType ? new MediaRecorder(recordStream, { mimeType }) : new MediaRecorder(recordStream)
    recordChunks = []
    discardRecording = false
    mediaRecorder.ondataavailable = (event) => { if (event.data && event.data.size > 0) recordChunks.push(event.data) }
    mediaRecorder.onstop = () => { if (discardRecording) { cleanupRecording(); return } uploadVoice() }
    mediaRecorder.start()
    recording.value = true
    recordSeconds.value = 0
    recordTimer = setInterval(() => {
      recordSeconds.value += 1
      if (recordSeconds.value >= 60) stopRecording()
    }, 1000)
  } catch (e) {
    cleanupRecording()
    ElMessage.error('无法访问麦克风，请检查浏览器权限或使用 HTTPS')
  }
}

const stopRecording = () => {
  if (recordTimer) { clearInterval(recordTimer); recordTimer = null }
  recording.value = false
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop()
}

const cancelRecording = () => {
  discardRecording = true
  stopRecording()
}

const toggleRecording = () => {
  if (recording.value) stopRecording()
  else startRecording()
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
.voice-btn { flex-shrink: 0; width: 38px; height: 38px; font-size: 17px; }
.recording-bar { flex: 1; height: 38px; display: flex; align-items: center; gap: 8px; padding: 0 12px; border-radius: 8px; background: #fff1f1; color: #b91c1c; font-size: 13px; }
.rec-dot { width: 9px; height: 9px; border-radius: 50%; background: #ef4444; animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
.voice-bubble { display: flex; align-items: center; gap: 8px; padding: 8px 10px; }
.voice-bubble audio { width: 230px; max-width: 100%; height: 34px; }
.voice-duration { flex-shrink: 0; font-size: 11px; opacity: .75; }
</style>
