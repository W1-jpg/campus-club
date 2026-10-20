<template>
  <PageLayout userType="expert">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <div>
            <h1 class="page-hero__title">通知提醒</h1>
            <p class="page-hero__subtitle">查看待办任务提醒与系统消息</p>
          </div>
          <span class="unread-badge" v-if="unreadCount > 0">{{ unreadCount }} 条未读</span>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-tabs">
          <button v-for="opt in filterOpts" :key="opt.val" :class="['ftab', { active: filterType === opt.val }]" @click="filterType = opt.val">{{ opt.label }}</button>
        </div>
        <el-button size="small" type="primary" plain @click="markAllRead" :disabled="unreadCount === 0">全部已读</el-button>
      </div>

      <div v-if="filteredList.length > 0" class="notify-list">
        <div class="notify-card" v-for="item in filteredList" :key="item.id" :class="{ unread: !item.is_read }" @click="openNotify(item)">
          <div class="notify-card__icon">
            <span v-if="item.type === 'review_task'">📋</span>
            <span v-else-if="item.type === 'system'">📢</span>
            <span v-else>🔔</span>
          </div>
          <div class="notify-card__body">
            <div class="notify-card__header">
              <h4>{{ item.title }}</h4>
              <span class="notify-card__time">{{ formatDate(item.create_time) }}</span>
            </div>
            <p class="notify-card__content" v-if="item.content">{{ item.content }}</p>
            <span class="notify-card__type-tag">{{ typeMap[item.type] || '提醒' }}</span>
          </div>
          <span v-if="!item.is_read" class="notify-card__dot"></span>
        </div>
      </div>
      <div v-else class="state-box"><span>🔔</span><p>暂无通知</p></div>

    <!-- 通知详情 -->
    <el-dialog v-model="showDialog" title="通知详情" width="480px">
      <div v-if="currentNotify" class="notify-detail">
        <h3>{{ currentNotify.title }}</h3>
        <p class="notify-detail__meta">{{ typeMap[currentNotify.type] }} · {{ formatDate(currentNotify.create_time) }}</p>
        <div class="notify-detail__content">{{ currentNotify.content || '暂无详细内容' }}</div>
        <el-button v-if="currentNotify.related_id" type="primary" size="small" @click="goReview">去处理 →</el-button>
      </div>
      <template #footer><el-button @click="showDialog=false">关闭</el-button></template>
    </el-dialog>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const notifications = ref([])
const filterType = ref('')
const showDialog = ref(false)
const currentNotify = ref(null)
const filterOpts = [
  { val: '', label: '全部' }, { val: 'review_task', label: '评审任务' },
  { val: 'system', label: '系统消息' }, { val: 'reminder', label: '提醒' }
]
const typeMap = { review_task: '评审任务', system: '系统消息', reminder: '提醒' }

const filteredList = computed(() => {
  if (!filterType.value) return notifications.value
  return notifications.value.filter(n => n.type === filterType.value)
})
const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)

const formatDate = (d) => { if(!d) return ''; const t = new Date(d); return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}` }

const loadNotifications = async () => {
  try {
    const expertId = localStorage.getItem('expertId') || 1
    const res = await request.get(`/api/expert/notifications/${expertId}`)
    if (res.data) notifications.value = res.data || []
  } catch (e) { console.error(e) }
}

const openNotify = async (item) => {
  currentNotify.value = item
  showDialog.value = true
  if (!item.is_read) {
    try { await request.put(`/api/expert/notifications/${item.id}/read`); item.is_read = 1 }
    catch (e) { console.error(e) }
  }
}

const markAllRead = async () => {
  for (const n of notifications.value) {
    if (!n.is_read) {
      try { await request.put(`/api/expert/notifications/${n.id}/read`); n.is_read = 1 } catch (e) {}
    }
  }
  ElMessage.success('全部标记已读')
}

const goReview = () => {
  showDialog.value = false
  router.push('/成果评审')
}

onMounted(() => loadNotifications())
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }
.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xl) var(--spacing-xxl); margin-bottom: var(--spacing-lg); color: var(--text-inverse); box-shadow: var(--shadow-md); display: flex; justify-content: space-between; align-items: center; }
.page-hero__title { font-size: var(--font-size-title); font-weight: 700; margin: 0 0 2px 0; }
.page-hero__subtitle { font-size: var(--font-size-sm); opacity: 0.8; margin: 0; }
.unread-badge { background: rgba(255,255,255,0.2); padding: 6px 16px; border-radius: var(--radius-round); font-size: var(--font-size-sm); font-weight: 600; white-space: nowrap; }

.filter-bar { display: flex; justify-content: space-between; align-items: center; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); flex-wrap: wrap; }
.filter-tabs { display: flex; gap: 4px; background: var(--bg-page); border-radius: var(--radius-md); padding: 4px; }
.ftab { padding: 6px 16px; border: none; border-radius: var(--radius-sm); background: transparent; font-size: var(--font-size-sm); color: var(--text-tertiary); cursor: pointer; transition: all var(--transition-fast); font-weight: 500; }
.ftab:hover { color: var(--text-primary); }
.ftab.active { background: var(--bg-card); color: var(--color-primary); font-weight: 600; box-shadow: var(--shadow-sm); }

.notify-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.notify-card { display: flex; align-items: flex-start; gap: var(--spacing-lg); padding: var(--spacing-lg); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-color); cursor: pointer; transition: all var(--transition-base); position: relative; }
.notify-card:hover { border-color: var(--color-primary-light); box-shadow: var(--shadow-md); transform: translateX(4px); }
.notify-card.unread { border-left: 3px solid var(--color-primary); background: var(--color-primary-bg-light); }
.notify-card__icon { width: 44px; height: 44px; border-radius: var(--radius-md); background: var(--bg-page); display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.notify-card__body { flex: 1; min-width: 0; }
.notify-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--spacing-md); margin-bottom: var(--spacing-xs); }
.notify-card__header h4 { font-size: var(--font-size-base); font-weight: 600; color: var(--text-primary); margin: 0; }
.notify-card__time { font-size: var(--font-size-xs); color: var(--text-tertiary); white-space: nowrap; flex-shrink: 0; }
.notify-card__content { font-size: var(--font-size-sm); color: var(--text-secondary); margin: var(--spacing-xs) 0; line-height: 1.5; }
.notify-card__type-tag { display: inline-block; padding: 2px 8px; border-radius: var(--radius-round); font-size: 11px; font-weight: 500; background: var(--color-primary-bg); color: var(--color-primary); }
.notify-card__dot { position: absolute; top: 12px; right: 12px; width: 8px; height: 8px; border-radius: 50%; background: var(--color-danger); }

.state-box { text-align: center; padding: var(--spacing-xxxl) var(--spacing-xl); background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.state-box span { font-size: 48px; display: block; margin-bottom: var(--spacing-md); }
.state-box p { color: var(--text-tertiary); font-size: var(--font-size-base); }

.notify-detail h3 { font-size: var(--font-size-xl); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; color: var(--text-primary); }
.notify-detail__meta { font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: var(--spacing-lg); }
.notify-detail__content { font-size: var(--font-size-base); color: var(--text-secondary); line-height: 1.8; padding: var(--spacing-lg); background: var(--bg-page); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg); }

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; align-items: stretch; }
  .notify-card { flex-direction: column; }
  .notify-card__header { flex-direction: column; }
}
</style>
