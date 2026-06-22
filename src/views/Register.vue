<template>
  <div class="register-page">
    <!-- ========== 左侧：品牌展示区 ========== -->
    <div class="register-left">
      <div class="left-logo">
        <div class="left-logo__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span>校园社团</span>
      </div>

      <div class="characters-area">
        <div class="characters-stage">
          <div ref="purpleRef" class="char char--purple" :style="purpleStyle">
            <div :style="purpleEyesStyle">
              <AnimatedEyeBall :size="22" :pupil-size="9" :max-distance="6" eye-color="white" pupil-color="#2D2D2D" :is-blinking="isPurpleBlinking" :force-look-x="purpleLookX" :force-look-y="purpleLookY" />
              <AnimatedEyeBall :size="22" :pupil-size="9" :max-distance="6" eye-color="white" pupil-color="#2D2D2D" :is-blinking="isPurpleBlinking" :force-look-x="purpleLookX" :force-look-y="purpleLookY" />
            </div>
          </div>
          <div ref="blackRef" class="char char--black" :style="blackStyle">
            <div :style="blackEyesStyle">
              <AnimatedEyeBall :size="18" :pupil-size="7" :max-distance="5" eye-color="white" pupil-color="#2D2D2D" :is-blinking="isBlackBlinking" :force-look-x="blackLookX" :force-look-y="blackLookY" />
              <AnimatedEyeBall :size="18" :pupil-size="7" :max-distance="5" eye-color="white" pupil-color="#2D2D2D" :is-blinking="isBlackBlinking" :force-look-x="blackLookX" :force-look-y="blackLookY" />
            </div>
          </div>
          <div ref="orangeRef" class="char char--orange" :style="orangeStyle">
            <div :style="orangeEyesStyle">
              <AnimatedPupil :size="14" :max-distance="6" pupil-color="#2D2D2D" :force-look-x="orangeLookX" :force-look-y="orangeLookY" />
              <AnimatedPupil :size="14" :max-distance="6" pupil-color="#2D2D2D" :force-look-x="orangeLookX" :force-look-y="orangeLookY" />
            </div>
          </div>
          <div ref="yellowRef" class="char char--yellow" :style="yellowStyle">
            <div :style="yellowEyesStyle">
              <AnimatedPupil :size="14" :max-distance="6" pupil-color="#2D2D2D" :force-look-x="yellowLookX" :force-look-y="yellowLookY" />
              <AnimatedPupil :size="14" :max-distance="6" pupil-color="#2D2D2D" :force-look-x="yellowLookX" :force-look-y="yellowLookY" />
            </div>
            <div class="char__mouth" :style="yellowMouthStyle" />
          </div>
        </div>
      </div>

      <div class="left-footer">
        <div class="left-footer__links">
          <a href="#" @click.prevent>隐私政策</a><span class="left-footer__dot">·</span>
          <a href="#" @click.prevent>服务条款</a><span class="left-footer__dot">·</span>
          <a href="#" @click.prevent>联系我们</a>
        </div>
        <p class="left-footer__copyright">&copy; 2026 校园社团成果展示与孵化系统</p>
      </div>

      <div class="left-decor left-decor--glow-1" />
      <div class="left-decor left-decor--glow-2" />
      <div class="left-decor left-decor--grid" />
    </div>

    <!-- ========== 右侧：注册表单区 ========== -->
    <div class="register-right">
      <div class="form-card">
        <div class="mobile-brand">
          <div class="mobile-brand__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span>校园社团成果展示与孵化系统</span>
        </div>

        <div class="form-header">
          <h1 class="form-header__title">创建账号</h1>
          <p class="form-header__desc">选择身份类型并填写注册信息</p>
        </div>

        <div class="identity-tabs">
          <button
            v-for="item in userTypes" :key="item.code"
            :class="['identity-tab', { 'identity-tab--active': userType === item.code }]"
            @click="switchType(item.code)"
          >
            <span class="identity-tab__dot" :class="`identity-tab__dot--${item.code}`" />
            {{ item.name }}
          </button>
        </div>

        <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="register-form-el" @submit.prevent="handleRegister">
          <el-form-item prop="username">
            <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large" @focus="isTyping = true" @blur="isTyping = false">
              <template #prefix>
                <svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </template>
            </el-input>
          </el-form-item>

          <el-row :gutter="14">
            <el-col :span="12">
              <el-form-item prop="password">
                <el-input v-model="registerForm.password" type="password" placeholder="密码" size="large" show-password>
                  <template #prefix><svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item prop="confirmPassword">
                <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" size="large" show-password>
                  <template #prefix><svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item prop="realName">
            <el-input v-model="registerForm.realName" placeholder="真实姓名" size="large">
              <template #prefix><svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="userType === 'student'" prop="phone">
            <el-input v-model="registerForm.phone" placeholder="手机号" size="large">
              <template #prefix><svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" x2="12" y1="18" y2="18.01"/></svg></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="userType === 'teacher'" prop="teacherNo">
            <el-input v-model="registerForm.teacherNo" placeholder="教师编号" size="large">
              <template #prefix><svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="userType === 'student' || userType === 'teacher'" prop="college">
            <el-select v-model="registerForm.college" placeholder="选择学院" size="large" class="college-select" popper-class="college-popper">
              <el-option label="软件学院" value="软件学院" />
              <el-option label="商学院" value="商学院" />
              <el-option label="艺术学院" value="艺术学院" />
            </el-select>
          </el-form-item>

          <el-form-item prop="email">
            <el-input v-model="registerForm.email" placeholder="电子邮箱" size="large">
              <template #prefix><svg class="input-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></template>
            </el-input>
          </el-form-item>

          <transition name="fade">
            <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
          </transition>

          <el-button type="primary" size="large" class="submit-btn" :loading="isLoading" @click="handleRegister">
            {{ isLoading ? '提交中...' : '注 册' }}
          </el-button>
        </el-form>

        <div class="form-foot">
          <span class="form-foot__text">已有账号？</span>
          <a class="form-foot__link" @click="goBack">返回登录</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '../api/auth'
import AnimatedPupil from '../components/AnimatedPupil.vue'
import AnimatedEyeBall from '../components/AnimatedEyeBall.vue'

const router = useRouter()
const route = useRoute()

const userType = ref(route.params.userType || 'student')
watch(() => route.params.userType, (t) => {
  userType.value = t || 'student'
  registerForm.value = { username: '', password: '', confirmPassword: '', realName: '', phone: '', teacherNo: '', email: '', college: '' }
})

const userTypes = [
  { code: 'student', name: '客户端' },
  { code: 'teacher', name: '教师端' },
  { code: 'admin', name: '管理员端' }
]

const switchType = (type) => { router.push(`/register/${type}`) }
const goBack = () => { router.push(`/login/${userType.value}`) }

const registerFormRef = ref(null)
const registerForm = ref({ username: '', password: '', confirmPassword: '', realName: '', phone: '', teacherNo: '', email: '', college: '' })
const errorMsg = ref('')
const isLoading = ref(false)

const registerRules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (_, v, cb) => { if (v !== registerForm.value.password) cb(new Error('两次密码不一致')); else cb() }, trigger: 'blur' }
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ required: userType.value === 'student', message: '请输入手机号', trigger: 'blur' }],
  teacherNo: [{ required: userType.value === 'teacher', message: '请输入教师编号', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  college: [{ required: userType.value === 'student' || userType.value === 'teacher', message: '请选择学院', trigger: 'change' }]
}))

const handleRegister = async () => {
  try {
    await registerFormRef.value.validate()
    errorMsg.value = ''
    isLoading.value = true
    await register(userType.value, registerForm.value)
    ElMessage.success('注册成功！请登录')
    router.push(`/login/${userType.value}`)
  } catch (error) {
    errorMsg.value = error.msg || error.message || '注册失败，请检查填写信息'
  } finally { isLoading.value = false }
}

// ======= 动画逻辑 =======
const mouseX = ref(0), mouseY = ref(0)
function onMouseMove(e) { mouseX.value = e.clientX; mouseY.value = e.clientY }
onMounted(() => window.addEventListener('mousemove', onMouseMove))
onUnmounted(() => window.removeEventListener('mousemove', onMouseMove))

const purpleRef = ref(null), blackRef = ref(null), orangeRef = ref(null), yellowRef = ref(null)
const isTyping = ref(false), isLookingAtEachOther = ref(false)
const isPurpleBlinking = ref(false), isBlackBlinking = ref(false)

let purpleTimer, blackTimer
function schedulePurple() {
  purpleTimer = setTimeout(() => { isPurpleBlinking.value = true; setTimeout(() => { isPurpleBlinking.value = false; schedulePurple() }, 150) }, Math.random() * 4000 + 3000)
}
function scheduleBlack() {
  blackTimer = setTimeout(() => { isBlackBlinking.value = true; setTimeout(() => { isBlackBlinking.value = false; scheduleBlack() }, 150) }, Math.random() * 4000 + 3000)
}
onMounted(() => { schedulePurple(); scheduleBlack() })
onUnmounted(() => { clearTimeout(purpleTimer); clearTimeout(blackTimer) })

let lookTimer = null
watch(isTyping, (v) => {
  clearTimeout(lookTimer)
  if (v) { isLookingAtEachOther.value = true; lookTimer = setTimeout(() => { isLookingAtEachOther.value = false }, 800) }
  else { isLookingAtEachOther.value = false }
})
onUnmounted(() => clearTimeout(lookTimer))

function calcPos(refEl) {
  if (!refEl.value) return { faceX: 0, faceY: 0, bodySkew: 0 }
  const r = refEl.value.getBoundingClientRect()
  return {
    faceX: Math.max(-15, Math.min(15, (mouseX.value - (r.left + r.width / 2)) / 20)),
    faceY: Math.max(-10, Math.min(10, (mouseY.value - (r.top + r.height / 3)) / 30)),
    bodySkew: Math.max(-6, Math.min(6, -(mouseX.value - (r.left + r.width / 2)) / 120))
  }
}

const pPos = computed(() => calcPos(purpleRef))
const bPos = computed(() => calcPos(blackRef))
const oPos = computed(() => calcPos(orangeRef))
const yPos = computed(() => calcPos(yellowRef))

const purpleLookX = computed(() => isLookingAtEachOther.value ? 3 : undefined)
const purpleLookY = computed(() => isLookingAtEachOther.value ? 4 : undefined)
const blackLookX = computed(() => isLookingAtEachOther.value ? 0 : undefined)
const blackLookY = computed(() => isLookingAtEachOther.value ? -5 : undefined)
const orangeLookX = computed(() => isLookingAtEachOther.value ? 4 : undefined)
const orangeLookY = computed(() => isLookingAtEachOther.value ? 3 : undefined)
const yellowLookX = computed(() => isLookingAtEachOther.value ? -3 : undefined)
const yellowLookY = computed(() => isLookingAtEachOther.value ? 2 : undefined)

const purpleStyle = computed(() => ({
  left: '54px', width: '160px',
  height: isTyping.value ? '410px' : '360px',
  backgroundColor: '#7C3AED',
  borderRadius: '12px 12px 0 0', zIndex: 1, position: 'absolute', bottom: 0,
  transform: isLookingAtEachOther.value
    ? `skewX(${(pPos.value.bodySkew || 0) - 12}deg) translateX(36px)`
    : isTyping.value ? `skewX(${(pPos.value.bodySkew || 0) - 6}deg)` : `skewX(${pPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out'
}))
const purpleEyesStyle = computed(() => ({
  left: isLookingAtEachOther.value ? '50px' : `${38 + pPos.value.faceX}px`,
  top: isLookingAtEachOther.value ? '60px' : `${36 + pPos.value.faceY}px`,
  position: 'absolute', display: 'flex', gap: '28px', transition: 'all 0.7s ease-in-out'
}))

const blackStyle = computed(() => ({
  left: '218px', width: '110px', height: '280px',
  backgroundColor: '#1F2937',
  borderRadius: '8px 8px 0 0', zIndex: 2, position: 'absolute', bottom: 0,
  transform: isLookingAtEachOther.value
    ? `skewX(${(bPos.value.bodySkew || 0) * 1.5 + 10}deg) translateX(18px)`
    : isTyping.value ? `skewX(${(bPos.value.bodySkew || 0) * 1.5}deg)` : `skewX(${bPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out'
}))
const blackEyesStyle = computed(() => ({
  left: isLookingAtEachOther.value ? '30px' : `${24 + bPos.value.faceX}px`,
  top: isLookingAtEachOther.value ? '10px' : `${28 + bPos.value.faceY}px`,
  position: 'absolute', display: 'flex', gap: '22px', transition: 'all 0.7s ease-in-out'
}))

const orangeStyle = computed(() => ({
  left: '-8px', width: '260px', height: '180px',
  backgroundColor: '#FB923C',
  borderRadius: '130px 130px 0 0', zIndex: 3, position: 'absolute', bottom: 0,
  transform: `skewX(${oPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out'
}))
const orangeEyesStyle = computed(() => ({
  left: `${90 + (oPos.value.faceX || 0)}px`, top: `${82 + (oPos.value.faceY || 0)}px`,
  position: 'absolute', display: 'flex', gap: '36px', transition: 'all 0.2s ease-out'
}))

const yellowStyle = computed(() => ({
  left: '290px', width: '130px', height: '210px',
  backgroundColor: '#FACC15',
  borderRadius: '65px 65px 0 0', zIndex: 4, position: 'absolute', bottom: 0,
  transform: `skewX(${yPos.value.bodySkew || 0}deg)`,
  transformOrigin: 'bottom center', transition: 'all 0.7s ease-in-out'
}))
const yellowEyesStyle = computed(() => ({
  left: `${48 + (yPos.value.faceX || 0)}px`, top: `${38 + (yPos.value.faceY || 0)}px`,
  position: 'absolute', display: 'flex', gap: '22px', transition: 'all 0.2s ease-out'
}))
const yellowMouthStyle = computed(() => ({
  left: `${38 + (yPos.value.faceX || 0)}px`, top: `${82 + (yPos.value.faceY || 0)}px`,
  position: 'absolute', width: '72px', height: '4px',
  backgroundColor: '#1F2937', borderRadius: '9999px', transition: 'all 0.2s ease-out'
}))
</script>

<style scoped>
.register-page {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
}
@media (min-width: 1024px) {
  .register-page { grid-template-columns: 48fr 52fr; }
}

/* ---- 左侧 ---- */
.register-left {
  display: none;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  background: linear-gradient(160deg, #7C3AED 0%, #6366F1 50%, #4F46E5 100%);
  padding: 44px 48px;
  color: #fff;
  overflow: hidden;
}
@media (min-width: 1024px) { .register-left { display: flex; } }

.left-logo {
  position: relative; z-index: 20;
  display: flex; align-items: center; gap: 12px;
  font-size: 20px; font-weight: 700; letter-spacing: -0.01em;
}
.left-logo__icon {
  width: 40px; height: 40px;
  border-radius: 12px;
  background: rgba(255,255,255,0.18);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; justify-content: center;
}
.left-logo__icon svg { width: 22px; height: 22px; }

.characters-area {
  position: relative; z-index: 20;
  display: flex; align-items: flex-end; justify-content: center;
  flex: 1; min-height: 420px;
}
.characters-stage {
  position: relative;
  width: 440px; height: 360px;
  transform: scale(0.9);
  transform-origin: center bottom;
}

.char__mouth {
  position: absolute;
  width: 72px; height: 4px;
  background-color: #1F2937;
  border-radius: 9999px;
}

.left-footer {
  position: relative; z-index: 20; text-align: center;
}
.left-footer__links {
  display: flex; justify-content: center; align-items: center; gap: 6px;
  font-size: 13px; margin-bottom: 8px;
}
.left-footer__links a { color: rgba(255,255,255,0.55); transition: color 0.2s; }
.left-footer__links a:hover { color: #fff; }
.left-footer__dot { color: rgba(255,255,255,0.25); }
.left-footer__copyright { font-size: 12px; color: rgba(255,255,255,0.3); }

.left-decor { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
.left-decor--glow-1 {
  top: 15%; right: 15%; width: 300px; height: 300px;
  background: rgba(168,85,247,0.25);
}
.left-decor--glow-2 {
  bottom: 20%; left: 10%; width: 350px; height: 350px;
  background: rgba(99,102,241,0.15);
}
.left-decor--grid {
  inset: 0; border-radius: 0; filter: none;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* ---- 右侧 ---- */
.register-right {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px;
  background: #F8FAFC;
  overflow-y: auto;
}

.form-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 20px;
  padding: 40px 40px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06);
  border: 1px solid #E5E7EB;
  margin: 16px 0;
}
@media (max-width: 480px) {
  .form-card { padding: 28px 20px; border-radius: 16px; }
}

.mobile-brand {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  font-size: 16px; font-weight: 600; color: #1F2937; margin-bottom: 36px;
}
@media (min-width: 1024px) { .mobile-brand { display: none; } }
.mobile-brand__icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: rgba(124,58,237,0.1);
  display: flex; align-items: center; justify-content: center;
}
.mobile-brand__icon svg { width: 20px; height: 20px; color: #7C3AED; }

.form-header { text-align: center; margin-bottom: 28px; }
.form-header__title {
  font-size: 30px; font-weight: 800; color: #111827;
  letter-spacing: -0.03em; margin-bottom: 8px;
}
.form-header__desc { font-size: 15px; color: #6B7280; }

/* 身份切换 */
.identity-tabs {
  display: flex; gap: 4px;
  background: #F3F4F6; border-radius: 14px;
  padding: 5px; margin-bottom: 28px;
}
.identity-tab {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 11px 12px; border: none; border-radius: 10px;
  background: transparent; font-size: 14px; font-weight: 600;
  color: #6B7280; cursor: pointer; transition: all 0.25s ease; white-space: nowrap;
}
.identity-tab:hover { color: #374151; background: rgba(255,255,255,0.6); }
.identity-tab--active { background: #fff; color: #111827; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04); }
.identity-tab__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.identity-tab__dot--student { background: #22C55E; }
.identity-tab__dot--teacher { background: #3B82F6; }
.identity-tab__dot--admin   { background: #F59E0B; }

/* 表单 */
.register-form-el { display: flex; flex-direction: column; gap: 2px; }

.input-icon-svg { width: 19px; height: 19px; color: #9CA3AF; flex-shrink: 0; }

:deep(.el-form-item) { margin-bottom: 14px; }
:deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #E5E7EB;
  padding: 2px 14px;
  transition: all 0.2s ease;
  background: #FAFBFC;
}
:deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #C4B5FD; background: #fff; }
:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px #A78BFA, 0 0 0 4px rgba(124,58,237,0.1);
  background: #fff;
}
:deep(.el-input__inner) { font-size: 15px; color: #111827; }
:deep(.el-input__inner::placeholder) { color: #9CA3AF; }
:deep(.el-form-item__error) { font-size: 12px; padding-top: 4px; color: #EF4444; }

/* 下拉 */
.college-select { width: 100%; }
:deep(.college-select .el-select__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px #E5E7EB;
  background: #FAFBFC;
  padding: 2px 14px;
}
:deep(.college-select .el-select__wrapper:hover) { box-shadow: 0 0 0 1px #C4B5FD; }
:deep(.college-select.is-focus .el-select__wrapper) {
  box-shadow: 0 0 0 2px #A78BFA, 0 0 0 4px rgba(124,58,237,0.1);
}

.form-error {
  padding: 12px 16px; font-size: 14px;
  color: #DC2626; background: #FEF2F2;
  border: 1px solid #FECACA; border-radius: 12px;
  margin: 8px 0 4px; line-height: 1.5;
}
.fade-enter-active, .fade-leave-active { transition: all 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-6px); }

.submit-btn {
  width: 100%; height: 50px; margin-top: 20px;
  font-size: 16px; font-weight: 700; letter-spacing: 0.08em;
  border-radius: 14px;
  background: linear-gradient(135deg, #7C3AED, #6366F1);
  border: none;
  box-shadow: 0 4px 16px rgba(124,58,237,0.3);
  transition: all 0.3s ease;
}
.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(124,58,237,0.4);
  background: linear-gradient(135deg, #8B5CF6, #4F46E5);
}
.submit-btn:active { transform: translateY(0); }
:deep(.submit-btn.is-loading) { background: linear-gradient(135deg, #7C3AED, #6366F1); }

.form-foot { text-align: center; margin-top: 24px; font-size: 15px; }
.form-foot__text { color: #9CA3AF; }
.form-foot__link { color: #7C3AED; font-weight: 700; margin-left: 4px; cursor: pointer; transition: color 0.2s; }
.form-foot__link:hover { color: #4F46E5; }
</style>
