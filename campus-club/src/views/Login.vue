<template>
  <div class="jd-login">
    <!-- 顶部通栏 -->
    <header class="jd-header">
      <div class="jd-header__inner">
        <div class="jd-header__logo" @click="$router.push('/')">
          <div class="jd-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span class="jd-logo-text">校园社团成果展示与孵化平台</span>
        </div>
        <div class="jd-header__right">
          <span class="jd-header__welcome">欢迎登录</span>
          <span class="jd-header__sep">|</span>
          <a class="jd-header__link" @click="goToRegister">免费注册</a>
        </div>
      </div>
    </header>

    <!-- 主体 -->
    <div class="jd-main">
      <div class="jd-container">
        <!-- 左侧品牌展示 -->
        <div class="jd-banner">
          <div class="jd-banner__bg">
            <div class="jd-banner__glow jd-banner__glow--1" />
            <div class="jd-banner__glow jd-banner__glow--2" />
          </div>
          <div class="jd-banner__content">
            <div class="jd-banner__title">校园社团成果</div>
            <div class="jd-banner__subtitle">展示 · 孵化 · 对接</div>
            <div class="jd-banner__features">
              <div class="jd-feat"><span class="jd-feat__icon">🚀</span>成果展示与孵化</div>
              <div class="jd-feat"><span class="jd-feat__icon">🤝</span>校企资源对接</div>
              <div class="jd-feat"><span class="jd-feat__icon">🏆</span>优质项目推荐</div>
            </div>
          </div>
        </div>

        <!-- 右侧登录卡片 -->
        <div class="jd-card">
          <div class="jd-tabs">
            <button v-for="item in userTypes" :key="item.code"
              :class="['jd-tab', { 'jd-tab--active': userType === item.code }]"
              @click="switchType(item.code)">{{ item.name }}</button>
          </div>

          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="jd-form" @submit.prevent="handleLogin">
            <el-form-item prop="username" class="jd-form-item">
              <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" class="jd-input" @focus="isTyping=true" @blur="isTyping=false">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password" class="jd-form-item">
              <el-input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" placeholder="请输入密码" size="large" class="jd-input" @keyup.enter="handleLogin">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></template>
                <template #suffix><span class="jd-pwd-toggle" @click="showPassword=!showPassword">{{ showPassword ? '隐藏' : '显示' }}</span></template>
              </el-input>
            </el-form-item>

            <div class="jd-form-extra">
              <label class="jd-checkbox"><input type="checkbox" v-model="rememberMe" /><span class="jd-checkbox__mark" /><span>记住密码</span></label>
              <a class="jd-link" @click="showResetDialog = true">忘记密码？</a>
            </div>

            <transition name="jd-error-fade">
              <div v-if="errorMsg" class="jd-error"><span class="jd-error__icon">!</span>{{ errorMsg }}</div>
            </transition>

            <button type="submit" class="jd-submit" :class="{ 'jd-submit--loading': isLoading }" :disabled="isLoading" @click="handleLogin">
              <span v-if="isLoading" class="jd-submit__spinner" />
              <span>{{ isLoading ? '登录中...' : '登  录' }}</span>
            </button>
          </el-form>

          <div class="jd-card__foot">
            <span class="jd-card__foot-text">还没有账号？</span>
            <a class="jd-link jd-link--strong" @click="goToRegister">立即注册</a>
          </div>
        </div>
      </div>
    </div>

    <footer class="jd-footer">
      <div class="jd-footer__links">
        <a @click.prevent>关于我们</a><span>|</span><a @click.prevent>隐私政策</a><span>|</span><a @click.prevent>服务条款</a><span>|</span><a @click.prevent>帮助中心</a>
      </div>
      <p class="jd-footer__copy">Copyright &copy; 2026 校园社团成果展示与孵化系统 版权所有</p>
    </footer>

    <!-- 密码重置弹窗 -->
    <el-dialog v-model="showResetDialog" title="找回密码" width="420px" :close-on-click-modal="true" @close="resetStep=1">
      <div v-if="resetStep===1" class="reset-form">
        <p class="reset-form__tip">请输入您的账号信息进行身份验证</p>
        <el-select v-model="resetForm.userType" placeholder="选择身份" size="large" style="width:100%;margin-bottom:14px"><el-option label="学生" value="student"/><el-option label="教师" value="teacher"/><el-option label="管理员" value="admin"/><el-option label="评审专家" value="expert"/><el-option label="企业" value="enterprise"/></el-select>
        <el-input v-model="resetForm.username" placeholder="用户名" size="large" style="margin-bottom:14px"/>
        <el-input v-model="resetForm.realName" placeholder="注册时的真实姓名" size="large" style="margin-bottom:14px"/>
        <button class="jd-submit" style="width:100%" :disabled="resetLoading" @click="verifyIdentity"><span v-if="resetLoading" class="jd-submit__spinner" />验证身份</button>
      </div>
      <div v-else class="reset-form">
        <p class="reset-form__tip reset-form__tip--success">✓ 身份验证通过，请设置新密码</p>
        <div class="jd-code-row" style="margin-bottom:14px">
          <el-input v-model="resetForm.code" placeholder="邮箱验证码" maxlength="6" size="large" class="jd-input"/>
          <button type="button" class="jd-code-btn" :disabled="resetCodeSending || resetCountdown > 0" @click="sendResetCode">
            {{ resetCountdown > 0 ? resetCountdown + 's' : (resetCodeSending ? '发送中...' : '获取验证码') }}
          </button>
        </div>
        <el-input v-model="resetForm.newPassword" type="password" placeholder="新密码（至少 6 位）" size="large" show-password style="margin-bottom:14px"/>
        <el-input v-model="resetForm.confirmPassword" type="password" placeholder="确认新密码" size="large" show-password style="margin-bottom:14px"/>
        <button class="jd-submit" style="width:100%" :disabled="resetLoading" @click="doResetPassword"><span v-if="resetLoading" class="jd-submit__spinner" />重置密码</button>
        <button class="jd-btn-back" @click="resetStep=1">返回上一步</button>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../api/auth'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const userType = ref(route.params.userType || 'student')
watch(() => route.params.userType, (t) => { userType.value = t || 'student' })

const userTypes = [
  { code: 'student', name: '学生端' }, { code: 'teacher', name: '教师端' },
  { code: 'expert', name: '专家端' }, { code: 'enterprise', name: '企业端' }, { code: 'admin', name: '管理员' }
]
const switchType = (type) => router.push(`/login/${type}`)
const goToRegister = () => router.push(`/register/${userType.value}`)

const showResetDialog = ref(false), resetStep = ref(1), resetLoading = ref(false)
const resetForm = reactive({ userType: '', username: '', realName: '', code: '', newPassword: '', confirmPassword: '' })
const resetCodeSending = ref(false), resetCountdown = ref(0)
let resetTimer = null

const sendResetCode = async () => {
  if (!resetForm.userType || !resetForm.username) { ElMessage.warning('请先选择身份并填写用户名'); return }
  resetCodeSending.value = true
  try {
    const res = await request.post('/api/auth/send-code', { username: resetForm.username, userType: resetForm.userType })
    ElMessage.success(res.msg || '验证码已发送')
    resetCountdown.value = 60
    clearInterval(resetTimer)
    resetTimer = setInterval(() => {
      resetCountdown.value -= 1
      if (resetCountdown.value <= 0) clearInterval(resetTimer)
    }, 1000)
  } catch (e) {
    ElMessage.error(e.msg || '验证码发送失败')
  } finally {
    resetCodeSending.value = false
  }
}

const verifyIdentity = async () => {
  if (!resetForm.userType || !resetForm.username || !resetForm.realName) { ElMessage.warning('请填写完整信息'); return }
  resetLoading.value = true
  try {
    const res = await request.post('/api/auth/verify-identity', { username: resetForm.username, userType: resetForm.userType, realName: resetForm.realName })
    if (res.code === 200) { ElMessage.success('身份验证通过'); resetStep.value = 2 } else { ElMessage.error(res.msg || '验证失败') }
  } catch { ElMessage.error('验证失败') }
  resetLoading.value = false
}
const doResetPassword = async () => {
  if (!resetForm.code) { ElMessage.warning('请输入邮箱验证码'); return }
  if (!resetForm.newPassword || resetForm.newPassword.length < 6) { ElMessage.warning('密码至少 6 位'); return }
  if (resetForm.newPassword !== resetForm.confirmPassword) { ElMessage.warning('两次密码不一致'); return }
  resetLoading.value = true
  try {
    const res = await request.post('/api/auth/reset-password', { username: resetForm.username, userType: resetForm.userType, realName: resetForm.realName, newPassword: resetForm.newPassword, code: resetForm.code })
    if (res.code === 200) { ElMessage.success('密码重置成功'); showResetDialog.value = false; resetStep.value = 1 } else { ElMessage.error(res.msg || '失败') }
  } catch { ElMessage.error('重置失败') }
  resetLoading.value = false
}

const loginFormRef = ref(null), loginForm = reactive({ username: '', password: '' })
const showPassword = ref(false), rememberMe = ref(false), errorMsg = ref(''), isLoading = ref(false)
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    errorMsg.value = ''; isLoading.value = true
    const res = await login(userType.value, loginForm)
    let loginData
    if (res.code && res.code === 200 && res.data) { loginData = res.data }
    else if (res.token) { loginData = res }
    else { throw new Error('登录响应格式错误') }
    localStorage.setItem('token', loginData.token)
    localStorage.setItem('userType', userType.value)
    localStorage.setItem('username', loginForm.username)
    if (userType.value === 'student') localStorage.setItem('studentId', loginData.studentId || loginData.user?.id)
    else if (userType.value === 'teacher') localStorage.setItem('teacherId', loginData.teacherId || loginData.user?.id)
    else if (userType.value === 'admin') localStorage.setItem('adminId', loginData.adminId || loginData.user?.id)
    else if (userType.value === 'expert') localStorage.setItem('expertId', loginData.user?.id)
    else if (userType.value === 'enterprise') localStorage.setItem('enterpriseId', loginData.user?.id)
    if (loginData.college || loginData.user?.college) localStorage.setItem('college', loginData.college || loginData.user.college)
    ElMessage.success('登录成功')
    const homeMap = { teacher: '/teacher-home', admin: '/admin-home', expert: '/expert-home', enterprise: '/enterprise-home' }
    router.push(homeMap[userType.value] || '/student-home')
  } catch (error) { errorMsg.value = error.msg || error.message || '登录失败，请检查用户名和密码' } finally { isLoading.value = false }
}
const isTyping = ref(false)
onUnmounted(() => clearInterval(resetTimer))
</script>

<style scoped>
.jd-login { min-height: 100vh; display: flex; flex-direction: column; background: #f4f4f4; }
.jd-header { background: #fff; border-bottom: 1px solid #e8e8e8; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.jd-header__inner { max-width: 1200px; margin: 0 auto; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.jd-header__logo { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.jd-logo-icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #e2231a, #c91623); display: flex; align-items: center; justify-content: center; }
.jd-logo-icon svg { width: 24px; height: 24px; color: #fff; }
.jd-logo-text { font-size: 18px; font-weight: 700; color: #222; }
.jd-header__right { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #666; }
.jd-header__welcome { color: #333; } .jd-header__sep { color: #ddd; }
.jd-header__link { color: #e2231a; cursor: pointer; font-weight: 500; } .jd-header__link:hover { color: #c91623; }

.jd-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px 24px; }
.jd-container { width: 100%; max-width: 1000px; display: grid; grid-template-columns: 1fr; background: #fff; border-radius: 16px; box-shadow: 0 2px 20px rgba(0,0,0,0.06); overflow: hidden; }
@media (min-width: 768px) { .jd-container { grid-template-columns: 1fr 460px; } }

.jd-banner { display: none; position: relative; min-height: 520px; background: linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #1a3a5c 70%, #3d1f5c 100%); overflow: hidden; }
@media (min-width: 768px) { .jd-banner { display: flex; align-items: center; justify-content: center; } }
.jd-banner__bg { position: absolute; inset: 0; }
.jd-banner__glow { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }
.jd-banner__glow--1 { top: -10%; left: -20%; width: 400px; height: 400px; background: rgba(226,35,26,0.2); }
.jd-banner__glow--2 { bottom: -10%; right: -15%; width: 350px; height: 350px; background: rgba(99,102,241,0.15); }
.jd-banner__content { position: relative; z-index: 2; text-align: center; padding: 40px; }
.jd-banner__title { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 8px; }
.jd-banner__subtitle { font-size: 16px; color: rgba(255,255,255,0.5); letter-spacing: 0.15em; margin-bottom: 48px; }
.jd-banner__features { display: flex; flex-direction: column; gap: 16px; }
.jd-feat { display: flex; align-items: center; gap: 14px; padding: 14px 20px; background: rgba(255,255,255,0.06); border-radius: 12px; color: rgba(255,255,255,0.75); font-size: 15px; font-weight: 500; border: 1px solid rgba(255,255,255,0.06); transition: all 0.3s; }
.jd-feat:hover { background: rgba(255,255,255,0.1); transform: translateX(4px); }
.jd-feat__icon { font-size: 22px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 12px; flex-shrink: 0; }

.jd-card { padding: 48px 44px; display: flex; flex-direction: column; }
@media (max-width: 480px) { .jd-card { padding: 32px 24px; } }
.jd-tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 36px; }
.jd-tab { flex: 1; padding: 14px 12px; border: none; background: none; font-size: 14px; font-weight: 600; color: #999; cursor: pointer; position: relative; transition: color 0.25s; }
.jd-tab:hover { color: #e2231a; }
.jd-tab--active { color: #e2231a; }
.jd-tab--active::after { content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 48px; height: 3px; background: #e2231a; border-radius: 2px; }
.jd-form { display: flex; flex-direction: column; }
.jd-form-item { margin-bottom: 20px; }
.jd-input :deep(.el-input__wrapper) { border-radius: 8px; box-shadow: 0 0 0 1px #ddd; padding: 2px 16px; background: #fafafa; transition: all 0.25s; height: 48px; }
.jd-input :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #bbb; background: #fff; }
.jd-input :deep(.el-input.is-focus .el-input__wrapper) { box-shadow: 0 0 0 2px #e2231a; background: #fff; }
.jd-input :deep(.el-input__inner) { font-size: 15px; color: #333; }
.jd-input :deep(.el-input__inner::placeholder) { color: #bbb; }
.jd-input-icon { display: flex; align-items: center; }
.jd-input-icon svg { width: 20px; height: 20px; color: #bbb; transition: color 0.25s; }
.jd-input :deep(.el-input.is-focus) .jd-input-icon svg { color: #e2231a; }
.jd-pwd-toggle { font-size: 13px; color: #999; cursor: pointer; padding: 4px 8px; } .jd-pwd-toggle:hover { color: #e2231a; }

.jd-code-row { display: flex; gap: 10px; width: 100%; align-items: stretch; }
.jd-code-row .jd-input { flex: 1; }
.jd-code-btn {
  flex-shrink: 0; min-width: 116px; padding: 0 14px; height: 48px; border-radius: 8px;
  border: 1px solid rgba(43, 90, 237, 0.35); background: rgba(43, 90, 237, 0.06);
  color: var(--color-primary); font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.jd-code-btn:hover:not(:disabled) { background: rgba(43, 90, 237, 0.12); }
.jd-code-btn:disabled { color: #9aa3b5; border-color: #d8dce6; background: #f5f6f8; cursor: not-allowed; }

.jd-form-extra { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.jd-checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #666; cursor: pointer; }
.jd-checkbox input { display: none; }
.jd-checkbox__mark { width: 16px; height: 16px; border-radius: 3px; border: 1.5px solid #ccc; flex-shrink: 0; transition: all 0.2s; }
.jd-checkbox input:checked + .jd-checkbox__mark { background: #e2231a; border-color: #e2231a; }
.jd-link { font-size: 13px; color: #999; cursor: pointer; transition: color 0.2s; } .jd-link:hover { color: #e2231a; }
.jd-link--strong { color: #e2231a; font-weight: 600; margin-left: 4px; } .jd-link--strong:hover { color: #c91623; }

.jd-error { display: flex; align-items: center; gap: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: #e2231a; background: #fff2f0; border: 1px solid #ffccc7; border-radius: 6px; }
.jd-error__icon { width: 18px; height: 18px; border-radius: 50%; background: #e2231a; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.jd-error-fade-enter-active, .jd-error-fade-leave-active { transition: all 0.25s; }
.jd-error-fade-enter-from, .jd-error-fade-leave-to { opacity: 0; transform: translateY(-4px); }

.jd-submit { width: 100%; height: 48px; border: none; border-radius: 8px; background: #e2231a; color: #fff; font-size: 18px; font-weight: 700; letter-spacing: 0.12em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.25s; }
.jd-submit:hover { background: #c91623; box-shadow: 0 4px 16px rgba(226,35,26,0.35); transform: translateY(-1px); }
.jd-submit:active { transform: translateY(0); box-shadow: none; }
.jd-submit--loading { background: #e88782; cursor: not-allowed; pointer-events: none; }
.jd-submit--loading:hover { background: #e88782; transform: none; box-shadow: none; }
.jd-submit__spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: jd-spin 0.6s linear infinite; }
@keyframes jd-spin { to { transform: rotate(360deg); } }

.jd-card__foot { display: flex; justify-content: center; align-items: center; margin-top: 28px; font-size: 14px; }
.jd-card__foot-text { color: #999; }

.jd-footer { text-align: center; padding: 24px 20px; background: #fff; border-top: 1px solid #eee; }
.jd-footer__links { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 13px; color: #999; margin-bottom: 8px; }
.jd-footer__links span { color: #ddd; } .jd-footer__links a { color: #999; cursor: pointer; transition: color 0.2s; }
.jd-footer__links a:hover { color: #e2231a; }
.jd-footer__copy { font-size: 12px; color: #bbb; }

.reset-form__tip { color: #666; font-size: 14px; text-align: center; margin-bottom: 20px; }
.reset-form__tip--success { color: #52c41a; }
.jd-btn-back { width: 100%; height: 44px; margin-top: 12px; border: 1px solid #ddd; border-radius: 8px; background: #fff; color: #666; font-size: 15px; cursor: pointer; transition: all 0.2s; }
.jd-btn-back:hover { border-color: #e2231a; color: #e2231a; }
@media (max-width: 767px) { .jd-main { padding: 20px 12px; } .jd-container { border-radius: 12px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); } .jd-tab { font-size: 12px; padding: 12px 6px; } }
/* ===== 玻璃拟态主题对齐（覆盖上面的京东红主题，错误提示红色语义保留） ===== */
.jd-login { background: transparent; }
.jd-header {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border-bottom-color: var(--glass-border);
  box-shadow: var(--glass-shadow);
}
.jd-logo-icon {
  background: var(--gradient-brand);
  box-shadow: 0 8px 20px rgba(43, 90, 237, 0.4);
}
.jd-container {
  background: var(--glass-bg-strong);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-xl);
}
.jd-card { background: transparent; }
.jd-banner__glow--1 { background: rgba(43, 90, 237, 0.30); }
.jd-tabs { border-bottom-color: rgba(43, 90, 237, 0.12); }
.jd-tab { color: #98a0b3; }
.jd-tab:hover,
.jd-tab--active { color: var(--color-primary); }
.jd-tab--active::after {
  background: var(--gradient-brand);
  border-radius: var(--radius-round);
}
.jd-header__link,
.jd-link--strong { color: var(--color-primary); }
.jd-header__link:hover,
.jd-link--strong:hover { color: var(--color-primary-dark); }
.jd-link:hover,
.jd-pwd-toggle:hover,
.jd-footer__links a:hover,
.jd-btn-back:hover { color: var(--color-primary); }
.jd-btn-back:hover { border-color: var(--color-primary); }
.jd-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 1px rgba(43, 90, 237, 0.14);
  border-radius: var(--radius-base);
}
.jd-input :deep(.el-input__wrapper:hover) {
  background: #fff;
  box-shadow: 0 0 0 1px rgba(43, 90, 237, 0.28);
}
.jd-input :deep(.el-input.is-focus .el-input__wrapper) {
  background: #fff;
  box-shadow: 0 0 0 2px rgba(43, 90, 237, 0.3), 0 8px 20px rgba(43, 90, 237, 0.12);
}
.jd-input :deep(.el-input.is-focus) .jd-input-icon svg { color: var(--color-primary); }
.jd-checkbox input:checked + .jd-checkbox__mark {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.jd-submit {
  background: var(--gradient-primary);
  border-radius: var(--radius-base);
  box-shadow: 0 10px 24px rgba(43, 90, 237, 0.32);
}
.jd-submit:hover {
  background: linear-gradient(135deg, #3562f0 0%, #5b86ff 100%);
  box-shadow: 0 14px 30px rgba(43, 90, 237, 0.42);
}
.jd-submit--loading,
.jd-submit--loading:hover { background: #9db4f5; }
.jd-footer {
  background: transparent;
  border-top-color: var(--glass-border);
}
</style>
