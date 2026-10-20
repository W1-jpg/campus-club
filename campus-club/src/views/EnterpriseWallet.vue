<template>
  <PageLayout userType="enterprise">
    <div class="wallet-content">
      <!-- 页面头部 -->
      <div class="page-hero">
        <div class="page-hero__inner">
          <div>
            <h1 class="page-hero__title">企业钱包</h1>
            <p class="page-hero__subtitle">资金管理 · 在线充值 · 交易明细</p>
          </div>
          <div class="page-hero__date">
            <span class="page-hero__day">{{ currentDay }}</span>
            <span class="page-hero__weekday">{{ currentWeekday }}</span>
          </div>
        </div>
      </div>

      <!-- 余额与统计概览 -->
      <div class="wallet-overview">
        <!-- 主余额卡片 -->
        <div class="balance-card">
          <div class="balance-card__top">
            <div class="balance-card__header">
              <div class="balance-card__logo">
                <svg viewBox="0 0 40 40" fill="none" class="balance-card__svg">
                  <rect width="40" height="40" rx="12" fill="rgba(255,255,255,0.15)"/>
                  <path d="M20 8v24M12 14l8-6 8 6M12 26l8 6 8-6" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="20" cy="20" r="3" fill="white"/>
                </svg>
              </div>
              <div>
                <span class="balance-card__label">账户余额</span>
                <div class="balance-card__amount">
                  <span class="balance-card__currency">¥</span>
                  <span class="balance-card__value">{{ formatMoney(wallet.balance) }}</span>
                </div>
              </div>
            </div>
            <el-button type="primary" size="large" round @click="openRecharge" class="recharge-btn">
              <el-icon><Plus /></el-icon> 充值
            </el-button>
          </div>
          <div class="balance-card__footer">
            <span class="balance-card__update">最近更新：{{ wallet.updateTime ? fmtTime(wallet.updateTime) : '--' }}</span>
            <span class="balance-card__safe"><el-icon><Lock /></el-icon> 资金安全由支付宝担保</span>
          </div>
        </div>

        <!-- 统计卡片 -->
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-item__icon" style="background:var(--color-primary-bg);">📥</span>
            <div class="stat-item__body">
              <span class="stat-item__value">¥{{ formatMoney(stats.totalRecharge) }}</span>
              <span class="stat-item__label">累计充值</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-item__icon" style="background:var(--color-warning-bg);">📤</span>
            <div class="stat-item__body">
              <span class="stat-item__value">¥{{ formatMoney(stats.totalSpend) }}</span>
              <span class="stat-item__label">累计支出</span>
            </div>
          </div>
          <div class="stat-item">
            <span class="stat-item__icon" style="background:var(--color-success-bg);">📋</span>
            <div class="stat-item__body">
              <span class="stat-item__value">{{ stats.rechargeCount }}<small> 次</small></span>
              <span class="stat-item__label">充值次数</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 交易记录 -->
      <div class="section-header">
        <h2 class="section-title">交易记录</h2>
        <span class="section-subtitle">资金变动明细，实时可查</span>
      </div>

      <div class="content-card">
        <el-tabs v-model="activeTab" @tab-change="loadTransactions" class="wallet-tabs">
          <el-tab-pane name="recharge">
            <template #label><span class="tab-label">📥 充值记录</span></template>
          </el-tab-pane>
          <el-tab-pane name="spend">
            <template #label><span class="tab-label">📤 消费记录</span></template>
          </el-tab-pane>
        </el-tabs>

        <el-table :data="transactions" v-loading="loading" style="width:100%" empty-text="暂无交易记录" :header-cell-style="{background:'#fafbfc',color:'#646A73',fontWeight:600}">
          <el-table-column prop="id" label="编号" width="75" align="center"/>
          <el-table-column prop="orderNo" label="订单号" min-width="190" show-overflow-tooltip>
            <template #default="s"><code class="order-code">{{ s.row.orderNo }}</code></template>
          </el-table-column>
          <el-table-column label="类型" width="85" align="center">
            <template #default="s">
              <el-tag size="small" :type="s.row.type === 'recharge' ? 'success' : 'warning'" effect="plain">
                {{ s.row.type === 'recharge' ? '充值' : '消费' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="140" align="right">
            <template #default="s">
              <span :class="['amount-cell', s.row.type === 'recharge' ? 'amount-in' : 'amount-out']">
                {{ s.row.type === 'recharge' ? '+' : '−' }}¥{{ formatMoney(s.row.amount) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="95" align="center">
            <template #default="s">
              <el-tag size="small" :type="statusTag(s.row.status)">{{ s.row.status || '--' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="备注" min-width="150" show-overflow-tooltip>
            <template #default="s"><span class="remark-text">{{ s.row.remark || '--' }}</span></template>
          </el-table-column>
          <el-table-column label="时间" width="175">
            <template #default="s">{{ fmtTime(s.row.createTime) }}</template>
          </el-table-column>
        </el-table>

        <div class="pagination-wrap" v-if="total > 0">
          <el-pagination
            v-model:current-page="pageNum"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next, jumper"
            @current-change="loadTransactions"
          />
        </div>
      </div>
    </div>

    <!-- ==================== 充值弹窗 ==================== -->
    <el-dialog v-model="rechargeDlg" :close-on-click-modal="false" class="recharge-dialog" width="520px">
      <template #header>
        <div class="dlg-header">
          <span class="dlg-header__icon">
            <svg viewBox="0 0 32 32" width="28" height="28"><rect width="32" height="32" rx="8" fill="#1677FF"/><path d="M16 6v20M10 11l6-5 6 5M10 21l6 5 6-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="16" r="2.5" fill="white"/></svg>
          </span>
          <span class="dlg-header__title">企业账户充值</span>
        </div>
      </template>

      <div class="recharge-body">
        <!-- 支付渠道标识 -->
        <div class="pay-channel-banner">
          <div class="pay-channel__logo">
            <span class="pay-channel__svg">支</span>
          </div>
          <div class="pay-channel__info">
            <span class="pay-channel__name">支付宝支付</span>
            <span class="pay-channel__desc">使用支付宝沙箱环境进行安全支付</span>
          </div>
          <el-tag size="small" type="success" effect="plain">官方渠道</el-tag>
        </div>

        <!-- 快捷金额 -->
        <div class="recharge-section">
          <p class="recharge-section__title">选择充值金额</p>
          <div class="amount-preset-grid">
            <div
              v-for="amt in presetAmounts"
              :key="amt"
              :class="['amount-preset', { active: selectedAmount === amt }]"
              @click="selectAmount(amt)"
            >
              <span class="amount-preset__value">¥{{ amt.toLocaleString() }}</span>
              <span class="amount-preset__check" v-if="selectedAmount === amt">
                <el-icon><Check /></el-icon>
              </span>
            </div>
          </div>
        </div>

        <!-- 自定义金额 -->
        <div class="recharge-section">
          <p class="recharge-section__title">自定义金额</p>
          <div class="custom-amount-row">
            <span class="custom-amount__prefix">¥</span>
            <el-input-number
              v-model="customAmount"
              :min="1"
              :max="500000"
              :step="100"
              :precision="2"
              size="large"
              controls-position="right"
              class="custom-amount__input"
              placeholder="输入金额"
              @change="onCustomAmount"
            />
          </div>
          <p class="custom-amount__hint">单笔限额 ¥500,000 · 实时到账</p>
        </div>

        <!-- 备注 -->
        <div class="recharge-section">
          <p class="recharge-section__title">备注（可选）</p>
          <el-input v-model="rechargeRemark" placeholder="例如：项目孵化资金充值…" maxlength="200" show-word-limit/>
        </div>

        <!-- 摘要 -->
        <div class="order-summary" v-if="finalAmount > 0">
          <div class="order-summary__row">
            <span>充值金额</span>
            <span class="order-summary__total">¥{{ finalAmount.toFixed(2) }}</span>
          </div>
          <div class="order-summary__row">
            <span>支付方式</span>
            <span class="order-summary__method">
              <span class="alipay-dot"></span>支付宝
            </span>
          </div>
          <div class="order-summary__row">
            <span>到账时间</span>
            <span>实时到账</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dlg-footer">
          <el-button @click="rechargeDlg = false" size="large">取消</el-button>
          <el-button type="primary" :loading="recharging" @click="doRecharge" :disabled="finalAmount <= 0" size="large" class="pay-submit-btn">
            <el-icon><Lock /></el-icon>
            确认支付 ¥{{ finalAmount.toFixed(2) }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </PageLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Lock, Check } from '@element-plus/icons-vue'
import PageLayout from '../components/PageLayout.vue'
import request from '../utils/request'

/* ========== 日期 ========== */
const currentDay = computed(() => { const n = new Date(); return `${n.getFullYear()}年${n.getMonth()+1}月${n.getDate()}日` })
const currentWeekday = computed(() => ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][new Date().getDay()])

/* ========== 钱包 ========== */
const wallet = ref({ balance: 0, updateTime: '' })
const stats = ref({ totalRecharge: 0, totalSpend: 0, rechargeCount: 0 })

const enterpriseId = () => parseInt(localStorage.getItem('enterpriseId') || '0')

const loadWallet = async () => {
  const eid = enterpriseId()
  if (!eid) return
  try {
    const r = await request.get(`/api/alipay/account/${eid}/stats`)
    if (r.code === 200) { wallet.value = r.data.wallet || wallet.value; stats.value = r.data.stats || stats.value }
  } catch {}
}

/* ========== 交易记录 ========== */
const activeTab = ref('recharge')
const transactions = ref([])
const loading = ref(false)
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const loadTransactions = async () => {
  const eid = enterpriseId()
  if (!eid) return
  loading.value = true
  try {
    const r = await request.get(`/api/alipay/records/${eid}`, {
      params: { type: activeTab.value, page: pageNum.value, size: pageSize.value }
    })
    if (r.code === 200) { transactions.value = r.data.records || []; total.value = r.data.total || 0 }
  } catch { ElMessage.error('加载交易记录失败') }
  finally { loading.value = false }
}

/* ========== 充值弹窗 ========== */
const rechargeDlg = ref(false)
const presetAmounts = [500, 1000, 2000, 5000, 10000, 20000, 50000]
const selectedAmount = ref(0)
const customAmount = ref(0)
const rechargeRemark = ref('')
const recharging = ref(false)

const finalAmount = computed(() => selectedAmount.value > 0 ? selectedAmount.value : customAmount.value)

const selectAmount = (amt) => { selectedAmount.value = amt; customAmount.value = 0 }
const onCustomAmount = () => { if (customAmount.value > 0) selectedAmount.value = 0 }

const openRecharge = () => {
  selectedAmount.value = 0
  customAmount.value = 0
  rechargeRemark.value = ''
  rechargeDlg.value = true
}

const doRecharge = async () => {
  const amount = finalAmount.value
  if (amount <= 0) { ElMessage.warning('请选择或输入充值金额'); return }

  recharging.value = true
  try {
    const eid = enterpriseId()
    const r = await request.post('/api/alipay/recharge', { enterpriseId: eid, amount, remark: rechargeRemark.value })
    if (r.code === 200) {
      const div = document.createElement('div')
      div.style.display = 'none'
      div.innerHTML = r.data
      document.body.appendChild(div)
      const form = div.querySelector('form')
      if (form) { form.submit() } else { ElMessage.error('解析支付表单失败') }
      rechargeDlg.value = false
      ElMessage.success('正在跳转到支付宝收银台…')
    } else {
      ElMessage.error(r.msg || '创建支付订单失败')
    }
  } catch (e) {
    ElMessage.error(e.msg || '创建订单失败')
  }
  finally { recharging.value = false }
}

/* ========== 工具函数 ========== */
const formatMoney = (v) => (v || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const statusTag = (s) => {
  const map = { '成功': 'success', '已到账': 'success', '处理中': 'warning', '失败': 'danger', '已退款': 'info' }
  return map[s] || 'info'
}
const fmtTime = (d) => {
  if (!d) return '--'
  const dt = new Date(d)
  return dt.getFullYear() + '-' + String(dt.getMonth()+1).padStart(2,'0') + '-' + String(dt.getDate()).padStart(2,'0') + ' ' + String(dt.getHours()).padStart(2,'0') + ':' + String(dt.getMinutes()).padStart(2,'0') + ':' + String(dt.getSeconds()).padStart(2,'0')
}

onMounted(() => { loadWallet(); loadTransactions() })
</script>

<style scoped>
.wallet-content { max-width: var(--content-max-width-wide); margin: 0 auto; padding: var(--spacing-xl); }

/* ===== 页面头部 ===== */
.page-hero { background: var(--gradient-hero); border-radius: var(--radius-xl); padding: var(--spacing-xxl) var(--spacing-xxxl); margin-bottom: var(--spacing-xl); color: var(--text-inverse); box-shadow: var(--shadow-lg); }
.page-hero__inner { display: flex; justify-content: space-between; align-items: center; }
.page-hero__title { font-size: var(--font-size-h1); font-weight: 700; margin: 0 0 var(--spacing-sm) 0; }
.page-hero__subtitle { font-size: var(--font-size-base); opacity: 0.85; margin: 0; letter-spacing: 0.05em; }
.page-hero__date { text-align: right; flex-shrink: 0; margin-left: var(--spacing-xl); }
.page-hero__day { display: block; font-size: var(--font-size-lg); opacity: 0.9; }
.page-hero__weekday { display: block; font-size: var(--font-size-title); font-weight: 700; }

/* ===== 余额与统计 ===== */
.wallet-overview { margin-bottom: var(--spacing-xxl); }

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #0f2347 0%, #1a3a7a 40%, #2250b5 100%);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xxl) var(--spacing-xxxl);
  color: #fff;
  box-shadow: 0 12px 40px rgba(43,90,237,0.25);
  margin-bottom: var(--spacing-lg);
}
.balance-card__top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--spacing-lg); }
.balance-card__header { display: flex; align-items: center; gap: var(--spacing-lg); }
.balance-card__logo { flex-shrink: 0; }
.balance-card__svg { display: block; }
.balance-card__label { font-size: var(--font-size-sm); opacity: 0.75; display: block; margin-bottom: 6px; }
.balance-card__amount { display: flex; align-items: baseline; gap: 2px; }
.balance-card__currency { font-size: var(--font-size-xl); font-weight: 400; opacity: 0.85; }
.balance-card__value { font-size: 52px; font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace; }
.balance-card__footer { display: flex; justify-content: space-between; align-items: center; padding-top: var(--spacing-lg); border-top: 1px solid rgba(255,255,255,0.1); }
.balance-card__update { font-size: var(--font-size-xs); opacity: 0.55; }
.balance-card__safe { font-size: var(--font-size-xs); opacity: 0.55; display: flex; align-items: center; gap: 4px; }
.recharge-btn { font-weight: 600 !important; padding: 14px 28px !important; font-size: var(--font-size-lg) !important; height: auto !important; box-shadow: 0 4px 16px rgba(0,0,0,0.2); }

/* 统计行 */
.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); }
.stat-item {
  background: var(--bg-card); border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex; align-items: center; gap: var(--spacing-lg);
  border: 1px solid var(--border-color); transition: all var(--transition-base);
}
.stat-item:hover { box-shadow: var(--shadow-md); border-color: var(--color-primary-light); }
.stat-item__icon {
  width: 48px; height: 48px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}
.stat-item__body { display: flex; flex-direction: column; gap: 2px; }
.stat-item__value { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); }
.stat-item__value small { font-size: var(--font-size-sm); font-weight: 400; color: var(--text-tertiary); }
.stat-item__label { font-size: var(--font-size-xs); color: var(--text-tertiary); }

/* ===== 交易记录 ===== */
.section-header { display: flex; align-items: baseline; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.section-title { font-size: var(--font-size-xxl); font-weight: 700; color: var(--text-primary); margin: 0; padding-left: var(--spacing-md); border-left: 4px solid var(--color-primary); }
.section-subtitle { font-size: var(--font-size-sm); color: var(--text-tertiary); }

.content-card { background: var(--bg-card); border-radius: var(--radius-xl); padding: var(--spacing-xl); box-shadow: var(--shadow-card); border: 1px solid var(--border-color); }

.wallet-tabs :deep(.el-tabs__header) { margin-bottom: var(--spacing-lg); }
.tab-label { display: flex; align-items: center; gap: 6px; font-size: var(--font-size-base); }

.order-code { font-family: var(--font-family-code); font-size: var(--font-size-xs); color: var(--text-secondary); background: var(--bg-page); padding: 2px 8px; border-radius: var(--radius-sm); }

.amount-cell { font-weight: 700; font-size: var(--font-size-base); font-family: var(--font-family-code); }
.amount-in { color: #52C41A; }
.amount-out { color: #FF4D4F; }
.remark-text { color: var(--text-tertiary); font-size: var(--font-size-sm); }

.pagination-wrap { display: flex; justify-content: flex-end; margin-top: var(--spacing-lg); }

/* ===== 充值弹窗 ===== */
.recharge-dialog :deep(.el-dialog__header) { padding: 0; margin: 0; border-bottom: 1px solid var(--border-color); }
.recharge-dialog :deep(.el-dialog__body) { padding: var(--spacing-xl); }
.recharge-dialog :deep(.el-dialog__footer) { padding: var(--spacing-lg) var(--spacing-xl); border-top: 1px solid var(--border-color); }

.dlg-header { display: flex; align-items: center; gap: var(--spacing-md); padding: var(--spacing-xl); }
.dlg-header__icon { display: flex; }
.dlg-header__title { font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary); }

.recharge-body { display: flex; flex-direction: column; gap: var(--spacing-xl); }

/* 支付宝渠道条 */
.pay-channel-banner {
  display: flex; align-items: center; gap: var(--spacing-md);
  background: linear-gradient(135deg, #E8F4FD 0%, #F0F7FF 100%);
  border: 1px solid #BAE0FF; border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}
.pay-channel__logo { flex-shrink: 0; }
.pay-channel__svg {
  display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; background: #1677FF; color: #fff;
  border-radius: var(--radius-md); font-size: 20px; font-weight: 700; font-family: serif;
}
.pay-channel__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.pay-channel__name { font-weight: 700; font-size: var(--font-size-base); color: var(--text-primary); }
.pay-channel__desc { font-size: var(--font-size-xs); color: var(--text-tertiary); }

.recharge-section { }
.recharge-section__title { font-size: var(--font-size-sm); font-weight: 600; color: var(--text-secondary); margin: 0 0 var(--spacing-md) 0; }

/* 快捷金额 */
.amount-preset-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--spacing-sm); }
.amount-preset-grid { grid-template-columns: repeat(4, 1fr); }
.amount-preset {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  padding: 14px 8px;
  border: 2px solid var(--border-color); border-radius: var(--radius-md);
  cursor: pointer; transition: all var(--transition-fast); background: var(--bg-card);
}
.amount-preset:hover { border-color: var(--color-primary-light); background: var(--color-primary-bg-light); }
.amount-preset.active { border-color: var(--color-primary); background: var(--color-primary-bg); }
.amount-preset__value { font-weight: 700; font-size: var(--font-size-base); color: var(--text-primary); }
.amount-preset__check {
  position: absolute; top: -6px; right: -6px;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--color-primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; box-shadow: 0 2px 6px rgba(43,90,237,0.3);
}

/* 自定义金额 */
.custom-amount-row { display: flex; align-items: center; gap: var(--spacing-md); }
.custom-amount__prefix { font-size: 28px; font-weight: 700; color: var(--text-primary); flex-shrink: 0; }
.custom-amount__input { flex: 1; }
.custom-amount__hint { font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: var(--spacing-sm); }

/* 订单摘要 */
.order-summary {
  background: var(--bg-page); border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  display: flex; flex-direction: column; gap: var(--spacing-sm);
}
.order-summary__row { display: flex; justify-content: space-between; align-items: center; font-size: var(--font-size-sm); color: var(--text-secondary); }
.order-summary__total { font-size: var(--font-size-xl); font-weight: 700; color: var(--color-primary); }
.order-summary__method { display: flex; align-items: center; gap: 6px; font-weight: 500; color: var(--text-primary); }
.alipay-dot { width: 8px; height: 8px; background: #1677FF; border-radius: 50%; }

.dlg-footer { display: flex; justify-content: flex-end; gap: var(--spacing-md); }
.pay-submit-btn { min-width: 200px; font-weight: 600 !important; }

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .wallet-content { padding: var(--spacing-md); }
  .page-hero { padding: var(--spacing-xl); }
  .page-hero__date { display: none; }
  .balance-card { padding: var(--spacing-xl); }
  .balance-card__top { flex-direction: column; gap: var(--spacing-lg); align-items: center; text-align: center; }
  .balance-card__header { flex-direction: column; }
  .balance-card__value { font-size: 36px; }
  .balance-card__footer { flex-direction: column; gap: var(--spacing-sm); align-items: center; }
  .stats-row { grid-template-columns: 1fr; }
  .amount-preset-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
