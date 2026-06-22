<template>
  <PageLayout userType="admin">
    <div class="admin-content">
      <div class="page-header">
        <div>
          <h2 class="page-header__title">管理员控制台</h2>
          <p class="page-header__subtitle">校园社团成果展示与孵化系统管理面板</p>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.studentCount }}</div>
            <div class="stat-card__label">学生数量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <el-icon :size="24"><UserFilled /></el-icon>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.teacherCount }}</div>
            <div class="stat-card__label">教师数量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--orange">
            <el-icon :size="24"><Grid /></el-icon>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.clubCount }}</div>
            <div class="stat-card__label">社团数量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <el-icon :size="24"><Document /></el-icon>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.resultCount }}</div>
            <div class="stat-card__label">成果数量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <el-icon :size="24"><Trophy /></el-icon>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.awardCount }}</div>
            <div class="stat-card__label">获奖数量</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--orange">
            <el-icon :size="24"><Box /></el-icon>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.resourceCount }}</div>
            <div class="stat-card__label">资源数量</div>
          </div>
        </div>
      </div>

      <div class="content-card">
        <h3 style="margin-bottom: var(--spacing-lg); font-size: var(--font-size-xl); color: var(--text-primary);">
          <el-icon :size="18"><Clock /></el-icon> 最近活动
        </h3>
        <div class="activity-list">
          <div class="activity-item" v-for="activity in recentActivities" :key="activity.id">
            <span class="activity-time">{{ activity.time }}</span>
            <span class="activity-content">{{ activity.content }}</span>
          </div>
          <el-empty v-if="recentActivities.length === 0" description="暂无活动记录" />
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, UserFilled, Grid, Document, Trophy, Box, Clock } from '@element-plus/icons-vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const stats = ref({
  studentCount: 0, teacherCount: 0, clubCount: 0,
  resultCount: 0, awardCount: 0, resourceCount: 0
})

const recentActivities = ref([
  { id: 1, time: '2026-04-21 10:00', content: '学生张三上传了新的成果' },
  { id: 2, time: '2026-04-21 09:30', content: '教师李四完成了成果评分' },
  { id: 3, time: '2026-04-21 09:00', content: '管理员王五添加了新的资源' },
  { id: 4, time: '2026-04-20 16:00', content: '学生赵六提交了获奖材料' },
  { id: 5, time: '2026-04-20 15:30', content: '教师钱七审核了资源申请' }
])

onMounted(() => { getStats() })

const getStats = async () => {
  try {
    const response = await request({ url: '/api/admin/stats', method: 'get' })
    if (response.code === 200) stats.value = response.data
    else ElMessage.error(response.msg || '获取统计数据失败')
  } catch (error) { ElMessage.error('获取统计数据失败') }
}
</script>

<style scoped>
.admin-content {
  max-width: var(--content-max-width-wide);
  margin: 0 auto;
  padding: var(--spacing-xl);
}

.activity-list {
  max-height: 320px;
  overflow-y: auto;
}
.activity-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid var(--border-color);
  gap: var(--spacing-lg);
}
.activity-item:last-child { border-bottom: none; }
.activity-time {
  color: var(--text-tertiary);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}
.activity-content {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  flex: 1;
}
</style>
