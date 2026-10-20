<template>
  <PageLayout userType="enterprise">
    <div class="enterprise-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <div>
            <h1 class="page-hero__title">企业工作台</h1>
            <p class="page-hero__subtitle">校企合作资源投递与管理平台</p>
          </div>
          <div class="page-hero__date">
            <span class="page-hero__day">{{ currentDay }}</span>
            <span class="page-hero__weekday">{{ currentWeekday }}</span>
          </div>
        </div>
      </div>

      <!-- 统计卡片 -->
      <div class="overview-cards">
        <div class="stat-card stat-card--blue">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box"><span>📦</span></div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ stats.resourceCount }}</div>
              <div class="stat-card__label">已投递资源</div>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card--orange">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box"><span>📋</span></div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ stats.applicationCount }}</div>
              <div class="stat-card__label">收到申请</div>
            </div>
          </div>
        </div>
        <div class="stat-card stat-card--green">
          <div class="stat-card__inner">
            <div class="stat-card__icon-box"><span>⭐</span></div>
            <div class="stat-card__body">
              <div class="stat-card__value">{{ stats.bookmarkCount }}</div>
              <div class="stat-card__label">收藏成果</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="section-header">
        <h2 class="section-title">快捷操作</h2>
        <span class="section-subtitle">常用功能一键直达</span>
      </div>
      <div class="action-grid">
        <div class="action-card" @click="$router.push('/enterprise-resources')">
          <div class="action-card__icon" style="background:var(--color-primary-bg);color:var(--color-primary);">💼</div>
          <div class="action-card__info">
            <span class="action-card__title">资源投递</span>
            <span class="action-card__desc">向学校投放资金/设备/导师等资源</span>
          </div>
          <span class="action-card__arrow">→</span>
        </div>
        <div class="action-card" @click="$router.push('/enterprise-applications')">
          <div class="action-card__icon" style="background:#FFF8E6;color:#FAAD14;">📋</div>
          <div class="action-card__info">
            <span class="action-card__title">审批申请</span>
            <span class="action-card__desc">查看并审批学生的资源申请</span>
          </div>
          <span class="action-card__arrow">→</span>
        </div>
        <div class="action-card" @click="$router.push('/enterprise-achievements')">
          <div class="action-card__icon" style="background:#F0FBE6;color:#52C41A;">🔍</div>
          <div class="action-card__info">
            <span class="action-card__title">浏览成果</span>
            <span class="action-card__desc">发现优秀学生成果并收藏</span>
          </div>
          <span class="action-card__arrow">→</span>
        </div>
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

const stats = ref({ resourceCount: 0, applicationCount: 0, bookmarkCount: 0 })

const currentDay = computed(() => { const n = new Date(); return `${n.getFullYear()}年${n.getMonth()+1}月${n.getDate()}日` })
const currentWeekday = computed(() => ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][new Date().getDay()])

onMounted(async () => {
  const eid = localStorage.getItem('enterpriseId')
  if (eid) {
    try { const r = await request.get('/api/enterprise/stats/' + eid); if (r.code === 200) stats.value = r.data } catch {}
  }
})
</script>

<style scoped>
.enterprise-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xxl) var(--spacing-xxxl); margin-bottom: var(--spacing-xl); color: var(--text-inverse); box-shadow: var(--shadow-lg); }
.page-hero__inner { display: flex; justify-content: space-between; align-items: center; }
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; }
.page-hero__date { text-align: right; flex-shrink: 0; margin-left: var(--spacing-xl); }
.page-hero__day { display: block; font-size: var(--font-size-lg); opacity: 0.9; }
.page-hero__weekday { display: block; font-size: var(--font-size-title); font-weight: 700; }

.overview-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-xxl); }
.stat-card { background: var(--bg-card); border-radius: var(--radius-xl); padding: var(--spacing-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); transition: all var(--transition-base); }
.stat-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.stat-card__inner { display: flex; align-items: center; gap: var(--spacing-lg); }
.stat-card__icon-box { width: 56px; height: 56px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; font-size: 28px; }
.stat-card--blue .stat-card__icon-box { background: var(--color-primary-bg); }
.stat-card--orange .stat-card__icon-box { background: var(--color-warning-bg); }
.stat-card--green .stat-card__icon-box { background: var(--color-success-bg); }
.stat-card__value { font-size: 30px; font-weight: 700; color: var(--text-primary); }
.stat-card__label { font-size: var(--font-size-sm); color: var(--text-tertiary); }

.section-header { display: flex; align-items: baseline; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.section-title { font-size: var(--font-size-xxl); font-weight: 700; color: var(--text-primary); margin: 0; padding-left: var(--spacing-md); border-left: 4px solid var(--color-primary); }
.section-subtitle { font-size: var(--font-size-sm); color: var(--text-tertiary); }

.action-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--spacing-md); }
.action-card { display: flex; align-items: center; gap: var(--spacing-lg); background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--spacing-xl); cursor: pointer; transition: all var(--transition-bounce); border: 1px solid var(--border-color); box-shadow: var(--shadow-card); }
.action-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--color-primary); }
.action-card__icon { width: 52px; height: 52px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
.action-card__info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.action-card__title { font-weight: 600; font-size: var(--font-size-base); color: var(--text-primary); }
.action-card__desc { font-size: var(--font-size-sm); color: var(--text-tertiary); }
.action-card__arrow { color: var(--text-disabled); font-size: 20px; transition: all var(--transition-fast); }
.action-card:hover .action-card__arrow { color: var(--color-primary); transform: translateX(4px); }

@media (max-width: 768px) {
  .enterprise-content { padding: var(--spacing-md); }
  .overview-cards { grid-template-columns: 1fr; }
  .page-hero { padding: var(--spacing-xl); }
  .page-hero__date { display: none; }
  .action-grid { grid-template-columns: 1fr; }
}
</style>
