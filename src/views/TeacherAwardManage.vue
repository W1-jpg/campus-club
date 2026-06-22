<template>
  <PageLayout userType="teacher">
    <div class="view-content">
      <div class="page-header">
        <h1 class="page-header__title">获奖情况</h1>
      </div>

      <div class="filter-bar">
        <el-select v-model="filterLevel" class="filter-select" @change="loadAwards">
          <option value="">全部等级</option>
          <option value="国家级">国家级</option>
          <option value="省级">省级</option>
          <option value="市级">市级</option>
          <option value="校级">校级</option>
          <option value="院级">院级</option>
        </el-select>
        <el-input v-model="searchKeyword" placeholder="搜索奖项名称" prefix-icon="el-icon-search" class="search-input" @input="handleSearch" />
      </div>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>

      <div v-else-if="awardsList.length === 0" class="empty-container">
        <el-empty description="暂无获奖记录" />
      </div>

      <div v-else class="awards-list">
        <div class="content-card content-card--accent" v-for="award in filteredAwards" :key="award.id">
          <div class="card-header">
            <h3 class="card-title">{{ award.title }}</h3>
            <span class="level-badge" :class="getLevelClass(award.level)">{{ award.level }}</span>
          </div>
          <div class="card-body">
            <div class="info-row"><span class="label">获奖学生：</span><span class="value">{{ award.studentName }}</span></div>
            <div class="info-row"><span class="label">所在学院：</span><span class="value">{{ award.college }}</span></div>
            <div class="info-row"><span class="label">获奖时间：</span><span class="value">{{ formatDate(award.awardTime) }}</span></div>
            <div class="description"><span class="label">获奖描述：</span><span class="value">{{ award.description }}</span></div>
            <div class="files-section" v-if="award.files && award.files.length > 0">
              <span class="label">上传文件：</span>
              <div class="files-list">
                <div v-for="(file, index) in award.files" :key="index" class="file-item">
                  <i class="el-icon-document"></i>
                  <span>{{ file.name }}</span>
                  <el-button type="primary" size="small" @click="downloadFile(file.url, file.name)"><i class="el-icon-download"></i> 下载</el-button>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn-view" @click="viewDetail(award.id)">查看详情</button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showDetailDialog" title="获奖详情" width="600px" @close="closeDetailDialog">
      <div class="detail-section" v-if="currentAward">
        <div class="detail-item"><span class="label">奖项名称：</span><span class="value">{{ currentAward.title }}</span></div>
        <div class="detail-item"><span class="label">获奖等级：</span><span class="value">{{ currentAward.level }}</span></div>
        <div class="detail-item"><span class="label">获奖学生：</span><span class="value">{{ currentAward.studentName }}</span></div>
        <div class="detail-item"><span class="label">所在学院：</span><span class="value">{{ currentAward.college }}</span></div>
        <div class="detail-item"><span class="label">获奖时间：</span><span class="value">{{ formatDate(currentAward.awardTime) }}</span></div>
        <div class="detail-item"><span class="label">获奖描述：</span><span class="value">{{ currentAward.description }}</span></div>
        <div class="detail-item" v-if="currentAward.files && currentAward.files.length > 0">
          <span class="label">上传文件：</span>
          <div class="files-list">
            <div v-for="(file, index) in currentAward.files" :key="index" class="file-item">
              <i class="el-icon-document"></i>
              <span>{{ file.name }}</span>
              <el-button type="primary" size="small" @click="downloadFile(file.url, file.name)"><i class="el-icon-download"></i> 下载</el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="closeDetailDialog">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
import PageLayout from '../components/PageLayout.vue'

const loading = ref(false)
const filterLevel = ref('')
const searchKeyword = ref('')
const awardsList = ref([])
const showDetailDialog = ref(false)
const currentAward = ref(null)

const formatDate = (date) => date ? new Date(date).toLocaleDateString() : ''

const getLevelClass = (level) => ({ '国家级': 'level-national', '省级': 'level-provincial', '市级': 'level-city', '校级': 'level-school', '院级': 'level-college' }[level] || '')

const filteredAwards = computed(() => {
  let filtered = awardsList.value
  if (filterLevel.value) filtered = filtered.filter(award => award.level === filterLevel.value)
  if (searchKeyword.value) { const keyword = searchKeyword.value.toLowerCase(); filtered = filtered.filter(award => award.title.toLowerCase().includes(keyword) || award.studentName.toLowerCase().includes(keyword)) }
  return filtered
})

const loadAwards = async () => {
  try {
    loading.value = true
    const res = await request({ url: '/api/award/list', method: 'get' })
    if (res.code === 200) { awardsList.value = res.data }
    else { ElMessage.error(res.msg || '获取获奖记录失败') }
  } catch (error) { console.error('获取获奖记录失败:', error); ElMessage.error('获取获奖记录失败，请检查网络') }
  finally { loading.value = false }
}

const handleSearch = () => {}

const viewDetail = async (id) => {
  try {
    const res = await request({ url: `/api/award/${id}`, method: 'get' })
    if (res.code === 200) { currentAward.value = res.data; showDetailDialog.value = true }
    else { ElMessage.error(res.msg || '获取详情失败') }
  } catch (error) { console.error('获取详情失败:', error); ElMessage.error('获取详情失败，请检查网络') }
}

const closeDetailDialog = () => { showDetailDialog.value = false; currentAward.value = null }

const downloadFile = (url, fileName) => { const link = document.createElement('a'); link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link) }

onMounted(() => { loadAwards() })
</script>

<style scoped>
.view-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

.page-header { margin-bottom: var(--spacing-xl); }

.filter-bar { margin-bottom: var(--spacing-xl); display: flex; gap: var(--spacing-lg); align-items: center; }
.filter-select { padding: 10px 16px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: var(--font-size-base); min-width: 180px; }
.search-input { flex: 1; max-width: 400px; }

.loading-container { display: flex; flex-direction: column; align-items: center; padding: 60px 0; }
.loading-spinner { width: 40px; height: 40px; border: 4px solid var(--border-color-light); border-top: 4px solid var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 10px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.empty-container { padding: 60px 0; text-align: center; }

.awards-list { display: flex; flex-direction: column; gap: var(--spacing-xl); }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.card-title { font-size: var(--font-size-title); font-weight: 600; color: var(--text-primary); margin: 0; flex: 1; line-height: 1.4; }

.level-badge { padding: 6px 16px; border-radius: var(--radius-xl); font-size: var(--font-size-xs); font-weight: 500; color: var(--text-inverse); }
.level-national { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%); }
.level-provincial { background: linear-gradient(135deg, #4ecdc4 0%, #45b7aa 100%); }
.level-city { background: linear-gradient(135deg, #45b7d1 0%, #2980b9 100%); }
.level-school { background: linear-gradient(135deg, #96ceb4 0%, #78c4a5 100%); }
.level-college { background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); }

.card-body { margin-bottom: 20px; }

.info-row { display: flex; margin-bottom: 10px; align-items: center; gap: var(--spacing-md); }
.label { font-size: var(--font-size-base); color: var(--text-secondary); min-width: 100px; font-weight: 500; flex-shrink: 0; }
.value { font-size: var(--font-size-base); color: var(--text-primary); flex: 1; }

.description { margin-top: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-xs); }
.description .value { line-height: 1.6; padding: var(--spacing-md); background: var(--color-primary-bg-light); border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); }

.files-section { margin-top: var(--spacing-lg); display: flex; flex-direction: column; gap: var(--spacing-sm); }
.files-list { display: flex; flex-direction: column; gap: var(--spacing-sm); padding: var(--spacing-md); background: var(--color-primary-bg); border-radius: var(--radius-md); border-left: 3px solid var(--color-primary); }

.file-item { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-sm); border-radius: var(--radius-base); transition: all var(--transition-base); }
.file-item:hover { background: var(--bg-card); box-shadow: var(--shadow-sm); }
.file-item i { font-size: var(--font-size-xl); color: var(--color-primary); }
.file-item span { flex: 1; font-size: var(--font-size-base); color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.card-footer { display: flex; gap: var(--spacing-lg); padding-top: 20px; border-top: 1px solid var(--border-color-light); }

.btn-view { padding: 10px 24px; border: none; border-radius: var(--radius-md); font-size: var(--font-size-base); font-weight: 500; cursor: pointer; transition: all var(--transition-base); background: var(--gradient-primary); color: var(--text-inverse); flex: 1; max-width: 200px; }
.btn-view:hover { transform: translateY(-3px); box-shadow: 0 6px 16px rgba(43, 90, 237, 0.4); }

.detail-section { display: flex; flex-direction: column; gap: var(--spacing-lg); }
.detail-item { display: flex; flex-direction: column; gap: var(--spacing-xs); }
.detail-item .label { font-size: var(--font-size-base); font-weight: 500; color: var(--text-secondary); min-width: auto; }
.detail-item .value { font-size: var(--font-size-base); color: var(--text-primary); line-height: 1.5; }

.dialog-footer { display: flex; justify-content: flex-end; }

@media (max-width: 768px) {
  .filter-bar { flex-direction: column; align-items: flex-start; }
  .filter-select, .search-input { width: 100%; max-width: none; }
  .btn-view { max-width: none; }
  .info-row { flex-direction: column; align-items: flex-start; gap: var(--spacing-xs); }
  .label { min-width: auto; }
}
</style>
