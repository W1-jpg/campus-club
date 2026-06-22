<template>
  <div class="login-page">
    <!-- ========== 左侧：动画角色展示区 ========== -->
    <div class="login-left">
      <!-- 顶部 Logo -->
      <div class="left-logo">
        <div class="left-logo__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span>校园社团</span>
      </div>

      <!-- 动画角色场景 -->
      <div class="characters-area">
        <div class="characters-stage">
          <!-- 紫色高个角色 - z1 -->
          <div ref="purpleRef" class="char char--purple" :style="purpleStyle">
            <div class="char__eyes char__eyes--purple" :style="purpleEyesStyle">
              <AnimatedEyeBall :size="22" :pupil-size="9" :max-distance="6" eye-color="white" pupil-color="#2D2D2D" :is-blinking="isPurpleBlinking" :force-look-x="purpleLookX" :force-look-y="purpleLookY" />
              <AnimatedEyeBall :size="22" :pupil-size="9" :max-distance="6" eye-color="white" pupil-color="#2D2D2D" :is-blinking="isPurpleBlinking" :force-look-x="purpleLookX" :force-look-y="purpleLookY" />
            </div>
          </div>

          <!-- 黑色中等角色 - z2 -->
          <div ref="blackRef" class="char char--black" :style="blackStyle">
            <div class="char__eyes char__eyes--black" :style="blackEyesStyle">
              <AnimatedEyeBall :size="18" :pupil-size="7" :max-distance="5" eye-color="white" pupil-color="#2D2D2D" :is-blinking="isBlackBlinking" :force-look-x="blackLookX" :force-look-y="blackLookY" />
              <AnimatedEyeBall :size="18" :pupil-size="7" :max-distance="5" eye-color="white" pupil-color="#2D2D2D" :is-blinking="isBlackBlinking" :force-look-x="blackLookX" :force-look-y="blackLookY" />
            </div>
          </div>

          <!-- 橙色半圆角色 - z3 -->
          <div ref="orangeRef" class="char char--orange" :style="orangeStyle">
            <div class="char__eyes char__eyes--orange" :style="orangeEyesStyle">
              <AnimatedPupil :size="14" :max-distance="6" pupil-color="#2D2D2D" :force-look-x="orangeLookX" :force-look-y="orangeLookY" />
              <AnimatedPupil :size="14" :max-distance="6" pupil-color="#2D2D2D" :force-look-x="orangeLookX" :force-look-y="orangeLookY" />
            </div>
          </div>

          <!-- 黄色圆角角色 - z4 -->
          <div ref="yellowRef" class="char char--yellow" :style="yellowStyle">
            <div class="char__eyes char__eyes--yellow" :style="yellowEyesStyle">
              <AnimatedPupil :size="14" :max-distance="6" pupil-color="#2D2D2D" :force-look-x="yellowLookX" :force-look-y="yellowLookY" />
              <AnimatedPupil :size="14" :max-distance="6" pupil-color="#2D2D2D" :force-look-x="yellowLookX" :force-look-y="yellowLookY" />
            </div>
            <div class="char__mouth" :style="yellowMouthStyle" />
          </div>
        </div>
      </div>

      <!-- 底部信息 -->
      <div class="left-footer">
        <div class="left-footer__links">
          <a href="#" @click.prevent>隐私政策</a>
          <span class="left-footer__dot">·</span>
          <a href="#" @click.prevent>服务条款</a>
          <span class="left-footer__dot">·</span>
          <a href="#" @click.prevent>联系我们</a>
        </div>
        <p class="left-footer__copyright">&copy; 2026 校园社团成果展示与孵化系统</p>
      </div>

      <!-- 装饰层 -->
      <div class="left-decor left-decor--glow-1" />
      <div class="left-decor left-decor--glow-2" />
      <div class="left-decor left-decor--grid" />
    </div>

    <!-- ========== 右侧：登录表单区 ========== -->
    <div class="login-right">
      <div class="form-card">
        <!-- 移动端 Logo -->
        <div class="mobile-brand">
          <div class="mobile-brand__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>校园社团成果展示与孵化系统</span>
        </div>

        <!-- 标题区 -->
        <div class="form-header">
          <h1 class="form-header__title">欢迎回来</h1>
          <p class="form-header__desc">选择身份类型并输入您的账号信息</p>
        </div>

        <!-- 身份选择 -->
        <div class="identity-tabs">
          <button
            v-for="item in userTypes"
            :key="item.code"
            :class="['identity-tab', { 'identity-tab--active': userType === item.code }]"
            @click="switchType(item.code)"
          >
            <span class="identity-tab__dot" :class="`identity-tab__dot--${item.code}`" />
            {{ item.name }}
          </button>
        </div>

        <!-- 登录表单 -->
        <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form-el" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              @focus="isTyping = true"
              @blur="isTyping = false"
            >
              <template #prefix>
                <svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <div class="pwd-wrap">
              <el-input
                v-model="loginForm.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                size="large"
              >
                <template #prefix>
                  <svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </template>
              </el-input>
              <button type="button" class="pwd-toggle" @click="showPassword = !showPassword" :aria-label="showPassword ? '隐藏密码' : '显示密码'">
                <svg v-if="showPassword" class="pwd-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                <svg v-else class="pwd-toggle__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </el-form-item>

          <div class="form-extra">
            <el-checkbox v-model="rememberMe" class="remember-check">
              <span class="remember-label">记住密码</span>
            </el-checkbox>
            <a href="#" class="forgot-link" @click.prevent>忘记密码？</a>
          </div>

          <transition name="fade">
            <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
          </transition>

          <el-button type="primary" size="large" class="submit-btn" :loading="isLoading" @click="handleLogin">
            {{ isLoading ? '验证中...' : '登 录' }}
          </el-button>
        </el-form>

        <div class="form-foot">
          <span class="form-foot__text">还没有账号？</span>
          <a class="form-foot__link" @click="goToRegister">立即注册</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login } from '../api/auth'
import AnimatedPupil from '../components/AnimatedPupil.vue'
import AnimatedEyeBall from '../components/AnimatedEyeBall.vue'

const router = useRouter()
const route = useRoute()

const userType = ref(route.params.userType || 'student')
watch(() => route.params.userType, (t) => { userType.value = t || 'student' })

const userTypes = [
  { code: 'student', name: '客户端' },
  { code: 'teacher', name: '教师端' },
  { code: 'admin', name: '管理员端' }
]

const switchType = (type) => { router.push(`/login/${type}`) }
const goToRegister = () => { router.push(`/register/${userType.value}`) }

const loginFormRef = ref(null)
const loginForm = reactive({ username: '', password: '' })
const showPassword = ref(false)
const rememberMe = ref(false)
const errorMsg = ref('')
const isLoading = ref(false)

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    errorMsg.value = ''
    isLoading.value = true
    const res = await login(userType.value, loginForm)
    let loginData
    if (res.code && res.code === 200 && res.data) { loginData = res.data }
    else if (res.token) { loginData = res }
    else { throw new Error('登录响应格式错误') }

    localStorage.setItem('token', loginData.token)
    localStorage.setItem('userType', userType.value)
    localStorage.setItem('username', loginForm.username)
    if (userType.value === 'student') { localStorage.setItem('studentId', loginData.studentId || loginData.user?.id) }
    else if (userType.value === 'teacher') { localStorage.setItem('teacherId', loginData.teacherId || loginData.user?.id) }
    else if (userType.value === 'admin') { localStorage.setItem('adminId', loginData.adminId || loginData.user?.id) }
    if (loginData.college || loginData.user?.college) { localStorage.setItem('college', loginData.college || loginData.user.college) }

    ElMessage.success('登录成功')
    if (userType.value === 'teacher') { router.push('/teacher-home') }
    else if (userType.value === 'admin') { router.push('/admin-home') }
    else { router.push('/student-home') }
  } catch (error) {
    if (error.message) { errorMsg.value = error.message }
    else { errorMsg.value = error.msg || '登录失败，请检查用户名和密码' }
  } finally { isLoading.value = false }
}

// ======= 鼠标 & 角色动画 =======
const mouseX = ref(0), mouseY = ref(0)
function onMouseMove(e) { mouseX.value = e.clientX; mouseY.value = e.clientY }
onMounted(() => window.addEventListener('mousemove', onMouseMove))
onUnmounted(() => window.removeEventListener('mousemove', onMouseMove))

const purpleRef = ref(null), blackRef = ref(null), orangeRef = ref(null), yellowRef = ref(null)
const isTyping = ref(false), isLookingAtEachOther = ref(false)
const isPurpleBlinking = ref(false), isBlackBlinking = ref(false), isPurplePeeking = ref(false)

let purpleBlinkTimer = null
function schedulePurpleBlink() {
  purpleBlinkTimer = setTimeout(() => {
    isPurpleBlinking.value = true
    setTimeout(() => { isPurpleBlinking.value = false; schedulePurpleBlink() }, 150)
  }, Math.random() * 4000 + 3000)
}
let blackBlinkTimer = null
function scheduleBlackBlink() {
  blackBlinkTimer = setTimeout(() => {
    isBlackBlinking.value = true
    setTimeout(() => { isBlackBlinking.value = false; scheduleBlackBlink() }, 150)
  }, Math.random() * 4000 + 3000)
}
onMounted(() => { schedulePurpleBlink(); scheduleBlackBlink() })
onUnmounted(() => { clearTimeout(purpleBlinkTimer); clearTimeout(blackBlinkTimer) })

let lookTimer = null
watch(isTyping, (v) => {
  clearTimeout(lookTimer)
  if (v) { isLookingAtEachOther.value = true; lookTimer = setTimeout(() => { isLookingAtEachOther.value = false }, 800) }
  else { isLookingAtEachOther.value = false }
})

let peekTimer = null
watch([() => loginForm.password, showPassword], ([pwd, show]) => {
  clearTimeout(peekTimer)
  if (pwd.length > 0 && show) {
    const schedulePeek = () => {
      peekTimer = setTimeout(() => {
        isPurplePeeking.value = true
        setTimeout(() => { isPurplePeeking.value = false; schedulePeek() }, 800)
      }, Math.random() * 3000 + 2000)
    }
    schedulePeek()
  } else { isPurplePeeking.value = false }
})
onUnmounted(() => { clearTimeout(lookTimer); clearTimeout(peekTimer) })

function calcPos(refEl) {
  if (!refEl.value) return { faceX: 0, faceY: 0, bodySkew: 0 }
  const r = refEl.value.getBoundingClientRect()
  const dx = mouseX.value - (r.left + r.width / 2)
  const dy = mouseY.value - (r.top + r.height / 3)
  return {
    faceX: Math.max(-15, Math.min(15, dx / 20)),
    faceY: Math.max(-10, Math.min(10, dy / 30)),
    bodySkew: Math.max(-6, Math.min(6, -dx / 120))
  }
}

const pPos = computed(() => calcPos(purpleRef))
const bPos = computed(() => calcPos(blackRef))
const oPos = computed(() => calcPos(orangeRef))
const yPos = computed(() => calcPos(yellowRef))

const pwdShow = computed(() => loginForm.password.length > 0 && showPassword.value)
const pwdHide = computed(() => loginForm.password.length > 0 && !showPassword.value)

const purpleLookX = computed(() => pwdShow.value ? (isPurplePeeking.value ? 5 : -5) : isLookingAtEachOther.value ? 3 : undefined)
const purpleLookY = computed(() => pwdShow.value ? (isPurplePeeking.value ? 5 : -5) : isLookingAtEachOther.value ? 4 : undefined)
const blackLookX = computed(() => pwdShow.value ? -5 : isLookingAtEachOther.value ? 0 : undefined)
const blackLookY = computed(() => pwdShow.value ? -5 : isLookingAtEachOther.value ? -5 : undefined)
const orangeLookX = computed(() => pwdShow.value ? -6 : undefined)
const orangeLookY = computed(() => pwdShow.value ? -5 : undefined)
const yellowLookX = computed(() => pwdShow.value ? -6 : undefined)
const yellowLookY = computed(() => pwdShow.value ? -5 : undefined)

const purpleStyle = computed(() => ({
  left: '54px', width: '160px',
  height: (isTyping.value || pwdHide.value) ? '410px' : '360px',
  backgroundColor: '#7C3AED',
  borderRadius: '12px 12px 0 0', zIndex: 1, position: 'absolute', bottom: 0,
  transform: pwdShow.value ? 'skewX(0deg)'
    : (isTyping.value || pwdHide.value) ? `skewX(${(pPos.value.bodySkew || 0) - 12}deg) translateX(36px)`
    : `skewX(${pPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out'
}))
const purpleEyesStyle = computed(() => ({
  left: pwdShow.value ? '18px' : isLookingAtEachOther.value ? '50px' : `${38 + pPos.value.faceX}px`,
  top: pwdShow.value ? '30px' : isLookingAtEachOther.value ? '60px' : `${36 + pPos.value.faceY}px`,
  position: 'absolute', display: 'flex', gap: '28px', transition: 'all 0.7s ease-in-out'
}))

const blackStyle = computed(() => ({
  left: '218px', width: '110px', height: '280px',
  backgroundColor: '#1F2937',
  borderRadius: '8px 8px 0 0', zIndex: 2, position: 'absolute', bottom: 0,
  transform: pwdShow.value ? 'skewX(0deg)'
    : isLookingAtEachOther.value ? `skewX(${(bPos.value.bodySkew || 0) * 1.5 + 10}deg) translateX(18px)`
    : (isTyping.value || pwdHide.value) ? `skewX(${(bPos.value.bodySkew || 0) * 1.5}deg)`
    : `skewX(${bPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out'
}))
const blackEyesStyle = computed(() => ({
  left: pwdShow.value ? '8px' : isLookingAtEachOther.value ? '30px' : `${24 + bPos.value.faceX}px`,
  top: pwdShow.value ? '24px' : isLookingAtEachOther.value ? '10px' : `${28 + bPos.value.faceY}px`,
  position: 'absolute', display: 'flex', gap: '22px', transition: 'all 0.7s ease-in-out'
}))

const orangeStyle = computed(() => ({
  left: '-8px', width: '260px', height: '180px',
  backgroundColor: '#FB923C',
  borderRadius: '130px 130px 0 0', zIndex: 3, position: 'absolute', bottom: 0,
  transform: pwdShow.value ? 'skewX(0deg)' : `skewX(${oPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out'
}))
const orangeEyesStyle = computed(() => ({
  left: pwdShow.value ? '55px' : `${90 + (oPos.value.faceX || 0)}px`,
  top: pwdShow.value ? '78px' : `${82 + (oPos.value.faceY || 0)}px`,
  position: 'absolute', display: 'flex', gap: '36px', transition: 'all 0.2s ease-out'
}))

const yellowStyle = computed(() => ({
  left: '290px', width: '130px', height: '210px',
  backgroundColor: '#FACC15',
  borderRadius: '65px 65px 0 0', zIndex: 4, position: 'absolute', bottom: 0,
  transform: pwdShow.value ? 'skewX(0deg)' : `skewX(${yPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out'
}))
const yellowEyesStyle = computed(() => ({
  left: pwdShow.value ? '18px' : `${48 + (yPos.value.faceX || 0)}px`,
  top: pwdShow.value ? '32px' : `${38 + (yPos.value.faceY || 0)}px`,
  position: 'absolute', display: 'flex', gap: '22px', transition: 'all 0.2s ease-out'
}))
const yellowMouthStyle = computed(() => ({
  left: pwdShow.value ? '8px' : `${38 + (yPos.value.faceX || 0)}px`,
  top: pwdShow.value ? '82px' : `${82 + (yPos.value.faceY || 0)}px`,
  position: 'absolute', width: '72px', height: '4px',
  backgroundColor: '#1F2937', borderRadius: '9999px', transition: 'all 0.2s ease-out'
}))
</script>

<style scoped>
/* ================================================================
   LOGIN PAGE — 全屏两栏布局
   ================================================================ */
.login-page {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
}
@media (min-width: 1024px) {
  .login-page { grid-template-columns: 48fr 52fr; }
}

/* ================================================================
   左侧 — 品牌展示区
   ================================================================ */
.login-left {
  display: none;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(160deg, #4F46E5 0%, #7C3AED 40%, #6366F1 100%);
  padding: 44px 48px;
  color: #fff;
  overflow: hidden;
}
@media (min-width: 1024px) { .login-left { display: flex; } }

/* ---- Logo ---- */
.left-logo {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.left-logo__icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
}
.left-logo__icon svg { width: 22px; height: 22px; }

/* ---- 角色场景 ---- */
.characters-area {
  position: relative;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  flex: 1;
  min-height: 420px;
}
.characters-stage {
  position: relative;
  width: 440px;
  height: 360px;
  transform: scale(0.9);
  transform-origin: center bottom;
}

/* ---- 角色嘴 ---- */
.char__mouth {
  position: absolute;
  width: 72px; height: 4px;
  background-color: #1F2937;
  border-radius: 9999px;
}

/* ---- 底部 ---- */
.left-footer {
  position: relative;
  z-index: 20;
  text-align: center;
}
.left-footer__links {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-bottom: 8px;
}
.left-footer__links a {
  color: rgba(255,255,255,0.55);
  transition: color 0.2s;
}
.left-footer__links a:hover { color: #fff; }
.left-footer__dot { color: rgba(255,255,255,0.25); }
.left-footer__copyright {
  font-size: 12px;
  color: rgba(255,255,255,0.3);
}

/* ---- 装饰 ---- */
.left-decor {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}
.left-decor--glow-1 {
  top: 15%; right: 15%;
  width: 300px; height: 300px;
  background: rgba(168,85,247,0.25);
}
.left-decor--glow-2 {
  bottom: 20%; left: 10%;
  width: 350px; height: 350px;
  background: rgba(99,102,241,0.15);
}
.left-decor--grid {
  inset: 0;
  border-radius: 0;
  filter: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* ================================================================
   右侧 — 表单区
   ================================================================ */
.login-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  background: #F8FAFC;
}

.form-card {
  width: 100%;
  max-width: 440px;
  background: #fff;
  border-radius: 20px;
  padding: 44px 40px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06);
  border: 1px solid #E5E7EB;
}

@media (max-width: 480px) {
  .form-card {
    padding: 32px 24px;
    border-radius: 16px;
  }
}

/* ---- 移动品牌 ---- */
.mobile-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 40px;
}
@media (min-width: 1024px) { .mobile-brand { display: none; } }
.mobile-brand__icon {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(79,70,229,0.1);
  display: flex; align-items: center; justify-content: center;
}
.mobile-brand__icon svg { width: 20px; height: 20px; color: #4F46E5; }

/* ---- 标题 ---- */
.form-header {
  text-align: center;
  margin-bottom: 32px;
}
.form-header__title {
  font-size: 30px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.03em;
  margin-bottom: 8px;
}
.form-header__desc {
  font-size: 15px;
  color: #6B7280;
}

/* ---- 身份选择 ---- */
.identity-tabs {
  display: flex;
  gap: 4px;
  background: #F3F4F6;
  border-radius: 14px;
  padding: 5px;
  margin-bottom: 32px;
}
.identity-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 11px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.25s ease;
  white-space: nowrap;
}
.identity-tab:hover { color: #374151; background: rgba(255,255,255,0.6); }
.identity-tab--active {
  background: #fff;
  color: #111827;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
}
.identity-tab__dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.identity-tab__dot--student { background: #22C55E; }
.identity-tab__dot--teacher { background: #3B82F6; }
.identity-tab__dot--admin   { background: #F59E0B; }

/* ---- 表单 ---- */
.login-form-el {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 输入图标 */
.input-icon-svg {
  width: 19px; height: 19px;
  color: #9CA3AF;
  flex-shrink: 0;
}

/* 输入框全局 */
:deep(.el-form-item) { margin-bottom: 16px; }
:deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #E5E7EB;
  padding: 2px 14px;
  transition: all 0.2s ease;
  background: #FAFBFC;
}
:deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #A5B4FC; background: #fff; }
:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px #818CF8, 0 0 0 4px rgba(99,102,241,0.1);
  background: #fff;
}
:deep(.el-input__inner) { font-size: 15px; color: #111827; }
:deep(.el-input__inner::placeholder) { color: #9CA3AF; }
:deep(.el-form-item__error) { font-size: 12px; padding-top: 4px; color: #EF4444; }

/* 密码框 */
.pwd-wrap { position: relative; width: 100%; }
.pwd-toggle {
  position: absolute;
  right: 14px; top: 50%;
  transform: translateY(-50%);
  background: none; border: none;
  color: #9CA3AF;
  cursor: pointer;
  padding: 6px;
  z-index: 2;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.pwd-toggle:hover { color: #4B5563; background: #F3F4F6; }
.pwd-toggle__icon { width: 20px; height: 20px; }

/* 记住我 / 忘记密码 */
.form-extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0 4px;
}
.remember-label { font-size: 14px; color: #6B7280; }
.forgot-link {
  font-size: 14px;
  font-weight: 600;
  color: #4F46E5;
  transition: color 0.2s;
}
.forgot-link:hover { color: #7C3AED; }

/* 错误提示 */
.form-error {
  padding: 12px 16px;
  font-size: 14px;
  color: #DC2626;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 12px;
  margin: 8px 0 4px;
  line-height: 1.5;
}
.fade-enter-active, .fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 50px;
  margin-top: 24px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.08em;
  border-radius: 14px;
  background: linear-gradient(135deg, #4F46E5, #7C3AED);
  border: none;
  box-shadow: 0 4px 16px rgba(79,70,229,0.3);
  transition: all 0.3s ease;
}
.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(79,70,229,0.4);
  background: linear-gradient(135deg, #6366F1, #8B5CF6);
}
.submit-btn:active { transform: translateY(0); }
:deep(.submit-btn.is-loading) { background: linear-gradient(135deg, #4F46E5, #7C3AED); }

/* 底部 */
.form-foot {
  text-align: center;
  margin-top: 28px;
  font-size: 15px;
}
.form-foot__text { color: #9CA3AF; }
.form-foot__link {
  color: #4F46E5;
  font-weight: 700;
  margin-left: 4px;
  cursor: pointer;
  transition: color 0.2s;
}
.form-foot__link:hover { color: #7C3AED; }
</style>
