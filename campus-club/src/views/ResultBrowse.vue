<template>
  <PageLayout :userType="userType">
    <div class="view-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <h1 class="page-hero__title">成果浏览</h1>
          <p class="page-hero__subtitle">按时间倒序浏览已审核通过的成果，掌握校园最新成果动态</p>
        </div>
      </div>

      <!-- 搜索 + 分类筛选 -->
      <div class="filter-bar">
        <div class="filter-bar__search">
          <span class="filter-bar__icon">🔍</span>
          <input v-model="searchKeyword" type="text" placeholder="搜索成果名称、类型..." class="filter-bar__input" @input="doSearch" />
        </div>
        <el-select v-model="filterType" placeholder="全部分类" clearable @change="reload" class="filter-bar__select">
          <el-option v-for="cat in allCategories" :key="cat" :label="cat" :value="cat" />
        </el-select>
      </div>

      <!-- 结果统计 -->
      <div class="result-summary" v-if="total > 0">
        <span>共 {{ total }} 项已审核通过的成果</span>
      </div>

      <!-- 成果卡片网格 -->
      <div v-if="list.length > 0" class="result-grid">
        <div class="result-card" v-for="item in list" :key="item.id" @click="viewDetail(item.id)">
          <div class="result-card__cover">
            <img :src="getCover(item)" alt="成果封面" @error="e => e.target.src = getPlaceholderCover(item.id, item.type)" />
            <span class="result-card__type-tag">{{ item.type }}</span>
          </div>
          <div class="result-card__body">
            <h3 class="result-card__title">{{ item.title }}</h3>
            <p class="result-card__desc">{{ item.description || '暂无描述' }}</p>
            <div class="result-card__meta">
              <span>{{ item.studentName || '学生' }} {{ item.college ? '· ' + item.college : '' }}</span>
              <span>📅 {{ formatDate(item.createTime) }}</span>
            </div>
            <div class="result-card__stats">
              <span class="result-card__stat">👁️ {{ item.viewCount || 0 }}</span>
              <span class="result-card__stat">💬 {{ item.commentCount || 0 }}</span>
              <span class="result-card__stat">👍 {{ item.likeCount || 0 }}</span>
            </div>
            <div class="result-card__actions">
              <button class="btn-detail" @click.stop="viewDetail(item.id)">查看详情</button>
              <button class="btn-like" :class="{ liked: item.isLiked }" @click.stop="likeResult(item)">
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

      <!-- 分页 -->
      <div class="pagination-wrap" v-if="total > 0">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="total"
          :page-size="size"
          :current-page="page"
          @current-change="changePage"
        />
      </div>
    </div>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import { getPlaceholderCover } from '../utils/cover'
import PageLayout from '../components/PageLayout.vue'

const router = useRouter()
const userType = ref(localStorage.getItem('userType') || 'student')
const list = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(9)
const searchKeyword = ref('')
const filterType = ref('')

const allCategories = computed(() => [...new Set(list.value.map(r => r.type).filter(Boolean))])

const getUserId = () => localStorage.getItem('studentId') || localStorage.getItem('teacherId') || localStorage.getItem('adminId') || localStorage.getItem('expertId') || localStorage.getItem('enterpriseId')

const loadResults = async () => {
  try {
    const params = {
      userId: getUserId(),
      userType: userType.value,
      college: localStorage.getItem('college') || '',
      page: page.value,
      size: size.value
    }
    if (filterType.value) params.type = filterType.value
    if (searchKeyword.value) params.search = searchKeyword.value
    const res = await request({ url: '/api/result/browse', method: 'get', params })
    if (res.code === 200) {
      list.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取成果列表失败')
    }
  } catch (error) {
    ElMessage.error(error.msg || '获取成果列表失败')
  }
}

const reload = () => { page.value = 1; loadResults() }
const doSearch = () => { page.value = 1; loadResults() }
const changePage = (p) => { page.value = p; loadResults() }

const viewDetail = (id) => router.push(`/成果详情/${id}`)

const likeResult = async (item) => {
  try {
    const userId = getUserId()
    if (!userId || !userType.value) { ElMessage.error('请先登录'); return }
    const url = item.isLiked ? '/api/result/unlike' : '/api/result/like'
    const res = await request({ url, method: 'post', params: { achievementId: item.id, userId, userType: userType.value } })
    if (res.code === 200) {
      item.isLiked = !item.isLiked
      item.likeCount = (item.likeCount || 0) + (item.isLiked ? 1 : -1)
      ElMessage.success(item.isLiked ? '点赞成功' : '已取消点赞')
    } else {
      ElMessage.error(res.msg || '操作失败')
    }
  } catch (error) {
    ElMessage.error(error.msg || '操作失败')
  }
}

const getCover = (item) => item.cover || getPlaceholderCover(item.id, item.type)

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
.filter-bar { display: flex; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); align-items: center; }
.filter-bar__search { flex: 1; display: flex; align-items: center; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 0 var(--spacing-lg); transition: all var(--transition-fast); }
.filter-bar__search:focus-within { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(43,90,237,0.1); }
.filter-bar__icon { font-size: 16px; margin-right: var(--spacing-sm); flex-shrink: 0; }
.filter-bar__input { flex: 1; border: none; outline: none; padding: 12px 0; font-size: var(--font-size-base); background: transparent; color: var(--text-primary); }
.filter-bar__input::placeholder { color: var(--text-tertiary); }
.filter-bar__select { width: 180px; flex-shrink: 0; }

/* 结果统计 */
.result-summary { font-size: var(--font-size-sm); color: var(--text-tertiary); margin-bottom: var(--spacing-md); }

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
.result-card__meta { font-size: var(--font-size-xs); color: var(--text-tertiary); display: flex; flex-direction: column; gap: 2px; }
.result-card__stats { display: flex; gap: var(--spacing-lg); padding: var(--spacing-sm) 0; border-top: 1px solid var(--border-color-light); border-bottom: 1px solid var(--border-color-light); }
.result-card__stat { font-size: var(--font-size-xs); color: var(--text-secondary); }
.result-card__actions { display: flex; gap: var(--spacing-sm); }
.btn-detail { flex: 1; padding: 8px 16px; border: none; border-radius: var(--radius-md); background: var(--gradient-primary); color: #fff; font-size: var(--font-size-sm); font-weight: 500; cursor: pointer; transition: all var(--transition-base); }
.btn-detail:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43,90,237,0.4); }
.btn-like { padding: 8px 14px; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--bg-card); color: var(--text-secondary); font-size: var(--font-size-sm); cursor: pointer; transition: all var(--transition-base); white-space: nowrap; }
.btn-like:hover { border-color: #ff4d4f; color: #ff4d4f; }
.btn-like.liked { border-color: #ff4d4f; background: #fff0f0; color: #ff4d4f; }

/* 分页 */
.pagination-wrap { display: flex; justify-content: center; margin-top: var(--spacing-xxl); }

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
