<template>
  <PageLayout userType="student">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">成果市场</h1>
          <p class="page-hero__subtitle">探索校园社团的精彩成果，发现创新与灵感</p>
        </div>
      </div>

      <!-- 搜索 + 分类筛选 -->
      <div class="filter-bar">
        <div class="filter-bar__search">
          <span class="filter-bar__icon">🔍</span>
          <input v-model="searchKeyword" type="text" placeholder="搜索成果名称、类型..." class="filter-bar__input" @input="doSearch" />
        </div>
        <el-select v-model="filterType" placeholder="全部分类" clearable @change="doSearch" class="filter-bar__select">
          <el-option v-for="cat in allCategories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </div>

      <!-- 成果卡片网格 -->
      <div v-if="filteredResults.length > 0" class="result-grid">
        <div class="result-card" v-for="item in filteredResults" :key="item.id" @click="viewDetail(item.id)">
          <div class="result-card__cover">
            <img :src="getCover(item)" alt="成果封面" @error="e => e.target.src = getPlaceholderCover(item.id, item.type)" />
            <span class="result-card__type-tag">{{ item.type }}</span>
          </div>
          <div class="result-card__body">
            <h3 class="result-card__title">{{ item.title }}</h3>
            <p class="result-card__desc">{{ item.description || '暂无描述' }}</p>
            <div class="result-card__meta">
              <span>📅 {{ formatDate(item.createTime) }}</span>
            </div>
            <div class="result-card__stats">
              <span class="result-card__stat">👁️ {{ item.viewCount || 0 }}</span>
              <span class="result-card__stat">💬 {{ item.comments ? item.comments.length : 0 }}</span>
              <span class="result-card__stat">👍 {{ item.likeCount || 0 }}</span>
            </div>
            <div class="result-card__actions">
              <button class="btn-detail" @click.stop="viewDetail(item.id)">查看详情</button>
              <button class="btn-like" :class="{ liked: item.isLiked }" @click.stop="likeResult(item.id)">
                {{ item.isLiked ? '❤️ 已赞' : '🤍 点赞' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-state__icon">📭</div>
        <p class="empty-state__text">暂无符合条件的成果</p>
        <p class="empty-state__hint">试试调整搜索关键词或筛选条件</p>
      </div>
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
const results = ref([])
const searchKeyword = ref('')
const filterType = ref('')

const allCategories = computed(() => [...new Set(results.value.map(r => r.type).filter(Boolean))])

const filteredResults = computed(() => {
  let list = results.value
  if (filterType.value) list = list.filter(r => r.type === filterType.value)
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(r =>
      (r.title || '').toLowerCase().includes(kw) ||
      (r.type || '').toLowerCase().includes(kw) ||
      (r.description || '').toLowerCase().includes(kw)
    )
  }
  return list
})

const doSearch = () => {}

const placeholderColors = [
  ['#667eea','#764ba2'],['#f093fb','#f5576c'],['#4facfe','#00f2fe'],
  ['#43e97b','#38f9d7'],['#fa709a','#fee140'],['#a18cd1','#fbc2eb'],
  ['#fccb90','#d57eeb'],['#e0c3fc','#8ec5fc'],['#30cfd0','#330867'],
  ['#a8edea','#fed6e3'],['#5ee7df','#b490ca'],['#d299c2','#fef9d7'],
  ['#f6d365','#fda085'],['#96fbc4','#f9f586'],['#ffecd2','#fcb69f']
]
const getPlaceholderCover = (id, type) => {
  const [c1, c2] = placeholderColors[(id || 1) % placeholderColors.length]
  const icon = { '软件':'💻','论文':'📄','文创':'🎨','发明':'⚡','实践':'🔧','艺术':'🎭','创业':'🚀','竞赛':'🏆','调查':'📊' }[type] || '📦'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:${c1}"/><stop offset="100%" style="stop-color:${c2}"/>
  </linearGradient></defs>
  <rect width="400" height="240" fill="url(#g)" rx="8"/>
  <text x="200" y="105" text-anchor="middle" font-size="48" fill="white" opacity="0.9">${icon}</text>
  <text x="200" y="148" text-anchor="middle" font-size="14" fill="white" opacity="0.7" font-family="sans-serif">${type||'成果'}</text>
</svg>`
  return 'data:image/svg+xml,' + encodeURIComponent(svg)
}
const getCover = (item) => item.cover || getPlaceholderCover(item.id, item.type)

const loadResults = async () => {
  try {
    const userId = localStorage.getItem('studentId') || localStorage.getItem('teacherId') || localStorage.getItem('adminId')
    const userType = localStorage.getItem('userType')
    const college = localStorage.getItem('college')
    const res = await request({ url: '/api/result/list', method: 'get', params: { userId, userType, college } })
    if (res.code === 200) results.value = (res.data || []).map(r => ({ ...r, isLiked: false }))
    else ElMessage.error(res.msg || '获取成果列表失败')
  } catch (error) { ElMessage.error('获取成果列表失败') }
}

const viewDetail = (id) => router.push(`/成果详情/${id}`)

const likeResult = async (id) => {
  try {
    const userId = localStorage.getItem('studentId') || localStorage.getItem('teacherId') || localStorage.getItem('adminId')
    const userType = localStorage.getItem('userType')
    if (!userId || !userType) { ElMessage.error('请先登录'); return }
    const res = await request({ url: '/api/result/like', method: 'post', params: { achievementId: id, userId, userType } })
    if (res.code === 200) {
      const item = results.value.find(r => r.id === id)
      if (item) { item.isLiked = !item.isLiked; item.likeCount = (item.likeCount || 0) + (item.isLiked ? 1 : -1) }
      ElMessage.success(item?.isLiked ? '点赞成功' : '已取消点赞')
    } else ElMessage.error(res.msg || '操作失败')
  } catch (error) { ElMessage.error('操作失败') }
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

onMounted(() => { loadResults() })
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

/* 页面 Hero 头部 */
.page-hero {
  background: var(--gradient-hero);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xxxl) var(--spacing-xxl);
  margin-bottom: var(--spacing-xl);
  color: var(--text-inverse);
  box-shadow: var(--shadow-lg);
}
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; }

/* 筛选栏 */
.filter-bar { display: flex; gap: var(--spacing-lg); margin-bottom: var(--spacing-xl); align-items: center; }
.filter-bar__search { flex: 1; display: flex; align-items: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 0 var(--spacing-lg); transition: all var(--transition-fast); }
.filter-bar__search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(43,90,237,0.1); }
.filter-bar__icon { font-size: 16px; margin-right: var(--spacing-sm); flex-shrink: 0; }
.filter-bar__input { flex: 1; border: none; outline: none; padding: 12px 0; font-size: var(--font-size-base); background: transparent; color: var(--text-primary); }
.filter-bar__input::placeholder { color: var(--text-tertiary); }
.filter-bar__select { width: 180px; flex-shrink: 0; }

/* 成果网格 */
.result-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--spacing-xl); }
.result-card { background: var(--bg-card); border-radius: var(--radius-xl); overflow: hidden; border: 1px solid var(--border-color); cursor: pointer; transition: all var(--transition-base); box-shadow: var(--shadow-card); }
.result-card:hover { transform: translateY(-6px); box-shadow: var(--shadow-xl); border-color: var(--color-primary-light); }
.result-card__cover { height: 180px; overflow: hidden; position: relative; background: var(--border-color-light); }
.result-card__cover img { width: 100%; height: 100%; object-fit: cover; transition: transform var(--transition-base); }
.result-card:hover .result-card__cover img { transform: scale(1.06); }
.result-card__type-tag { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.55); color: #fff; padding: 3px 10px; border-radius: var(--radius-round); font-size: var(--font-size-xs); font-weight: 500; backdrop-filter: blur(4px); }
.result-card__body { padding: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-sm); }
.result-card__title { font-size: var(--font-size-lg); font-weight: 600; color: var(--text-primary); margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.result-card__desc { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.result-card__meta { font-size: var(--font-size-xs); color: var(--text-tertiary); }
.result-card__stats { display: flex; gap: var(--spacing-lg); padding: var(--spacing-sm) 0; border-top: 1px solid var(--border-color-light); border-bottom: 1px solid var(--border-color-light); }
.result-card__stat { font-size: var(--font-size-xs); color: var(--text-secondary); }
.result-card__actions { display: flex; gap: var(--spacing-sm); }
.btn-detail { flex: 1; padding: 8px 16px; border: none; border-radius: var(--radius-md); background: var(--gradient-primary); color: #fff; font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; transition: all var(--transition-base); }
.btn-detail:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43,90,237,0.4); }
.btn-like { padding: 8px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-secondary); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-base); white-space: nowrap; }
.btn-like:hover { border-color: #ff4d4f; color: #ff4d4f; }
.btn-like.liked { border-color: #ff4d4f; background: #fff0f0; color: #ff4d4f; }

/* 空状态 */
.empty-state { text-align: center; padding: 80px 20px; background: var(--bg-card); border-radius: var(--radius-xl); border: 1px solid var(--border-color); }
.empty-state__icon { font-size: 64px; margin-bottom: var(--spacing-lg); }
.empty-state__text { font-size: var(--font-size-lg); color: var(--text-secondary); margin: 0 0 var(--spacing-sm) 0; font-weight: 500; }
.empty-state__hint { font-size: var(--font-size-sm); color: var(--text-tertiary); margin: 0; }

@media (max-width: 1024px) {
  .result-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
}
@media (max-width: 768px) {
  .filter-bar { flex-direction: column; }
  .filter-bar__select { width: 100%; }
  .result-grid { grid-template-columns: 1fr; gap: var(--spacing-md); }
  .page-hero { padding: var(--spacing-xl); }
  .page-hero__title { font-size: var(--font-size-title); }
}
</style>
