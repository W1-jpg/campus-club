<template>
  <div class="jd-register">
    <header class="jd-header">
      <div class="jd-header__inner">
        <div class="jd-header__logo" @click="$router.push('/')">
          <div class="jd-logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <span class="jd-logo-text">校园社团成果展示与孵化平台</span>
        </div>
        <div class="jd-header__right">
          <span class="jd-header__welcome">欢迎注册</span>
          <span class="jd-header__sep">|</span>
          <a class="jd-header__link" @click="goBack">已有账号？请登录</a>
        </div>
      </div>
    </header>

    <div class="jd-main">
      <div class="jd-container">
        <div class="jd-banner">
          <div class="jd-banner__bg">
            <div class="jd-banner__glow jd-banner__glow--1" />
            <div class="jd-banner__glow jd-banner__glow--2" />
          </div>
          <div class="jd-banner__content">
            <div class="jd-banner__title">加入我们</div>
            <div class="jd-banner__subtitle">创建账号 · 开启成果孵化之旅</div>
            <div class="jd-banner__features">
              <div class="jd-feat"><span class="jd-feat__icon">📤</span>上传展示成果</div>
              <div class="jd-feat"><span class="jd-feat__icon">🔍</span>获取专家评审</div>
              <div class="jd-feat"><span class="jd-feat__icon">💼</span>对接企业资源</div>
            </div>
          </div>
        </div>

        <div class="jd-card">
          <div class="jd-tabs">
            <button v-for="item in userTypes" :key="item.code"
              :class="['jd-tab', { 'jd-tab--active': userType === item.code }]"
              @click="switchType(item.code)">{{ item.name }}</button>
          </div>

          <el-form ref="registerFormRef" :model="registerForm" :rules="registerRules" class="jd-form" @submit.prevent="handleRegister">
            <el-form-item prop="username" class="jd-form-item">
              <el-input v-model="registerForm.username" placeholder="请输入用户名" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="password" class="jd-form-item">
              <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" size="large" class="jd-input" show-password>
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="confirmPassword" class="jd-form-item">
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" size="large" class="jd-input" show-password>
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span></template>
              </el-input>
            </el-form-item>
            <el-form-item prop="realName" class="jd-form-item">
              <el-input v-model="registerForm.realName" placeholder="请输入真实姓名" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span></template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="userType === 'student'" prop="phone" class="jd-form-item">
              <el-input v-model="registerForm.phone" placeholder="请输入手机号" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" x2="12" y1="18" y2="18.01"/></svg></span></template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="userType === 'teacher'" prop="teacherNo" class="jd-form-item">
              <el-input v-model="registerForm.teacherNo" placeholder="请输入教师编号" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg></span></template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="userType === 'expert'" prop="field" class="jd-form-item">
              <el-select v-model="registerForm.field" placeholder="请选择专业领域" size="large" class="jd-select">
                <el-option label="软件开发" value="软件开发"/><el-option label="学术论文" value="学术论文"/>
                <el-option label="文创设计" value="文创设计"/><el-option label="科技发明" value="科技发明"/>
                <el-option label="创业项目" value="创业项目"/><el-option label="艺术表演" value="艺术表演"/>
                <el-option label="社会实践" value="社会实践"/><el-option label="竞赛管理" value="竞赛管理"/>
              </el-select>
            </el-form-item>
            <el-form-item v-if="userType === 'expert'" prop="title" class="jd-form-item">
              <el-input v-model="registerForm.title" placeholder="职称（如：教授）" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></span></template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="userType === 'expert'" prop="organization" class="jd-form-item">
              <el-input v-model="registerForm.organization" placeholder="所属单位" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span></template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="userType === 'enterprise'" prop="companyName" class="jd-form-item">
              <el-input v-model="registerForm.companyName" placeholder="企业名称" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span></template>
              </el-input>
            </el-form-item>
            <el-form-item v-if="userType === 'enterprise'" prop="industry" class="jd-form-item">
              <el-select v-model="registerForm.industry" placeholder="选择所属行业" size="large" class="jd-select">
                <el-option v-for="t in industries" :key="t" :label="t" :value="t"/>
              </el-select>
            </el-form-item>
            <el-form-item v-if="userType === 'enterprise'" prop="address" class="jd-form-item">
              <el-input v-model="registerForm.address" placeholder="企业地址" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span></template>
              </el-input>
            </el-form-item>

            <el-form-item v-if="userType === 'student' || userType === 'teacher'" prop="college" class="jd-form-item">
              <el-select v-model="registerForm.college" placeholder="选择学院" size="large" class="jd-select">
                <el-option label="软件学院" value="软件学院"/><el-option label="商学院" value="商学院"/><el-option label="艺术学院" value="艺术学院"/>
              </el-select>
            </el-form-item>

            <el-form-item prop="email" class="jd-form-item">
              <el-input v-model="registerForm.email" placeholder="请输入电子邮箱" size="large" class="jd-input">
                <template #prefix><span class="jd-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></span></template>
              </el-input>
            </el-form-item>

            <el-form-item prop="code" class="jd-form-item">
              <div class="jd-code-row">
                <el-input v-model="registerForm.code" placeholder="邮箱验证码" maxlength="6" size="large" class="jd-input"/>
                <button type="button" class="jd-code-btn" :disabled="codeSending || countdown > 0" @click="sendRegisterCode">
                  {{ countdown > 0 ? countdown + 's' : (codeSending ? '发送中...' : '获取验证码') }}
                </button>
              </div>
            </el-form-item>

            <transition name="jd-error-fade">
              <div v-if="errorMsg" class="jd-error"><span class="jd-error__icon">!</span>{{ errorMsg }}</div>
            </transition>

            <button type="submit" class="jd-submit" :class="{ 'jd-submit--loading': isLoading }" :disabled="isLoading" @click="handleRegister">
              <span v-if="isLoading" class="jd-submit__spinner" /><span>{{ isLoading ? '提交中...' : '注  册' }}</span>
            </button>
          </el-form>

          <div class="jd-card__foot">
            <span class="jd-card__foot-text">已有账号？</span>
            <a class="jd-link jd-link--strong" @click="goBack">返回登录</a>
          </div>
        </div>
      </div>
    </div>

    <footer class="jd-footer">
      <div class="jd-footer__links"><a @click.prevent>关于我们</a><span>|</span><a @click.prevent>隐私政策</a><span>|</span><a @click.prevent>服务条款</a><span>|</span><a @click.prevent>帮助中心</a></div>
      <p class="jd-footer__copy">Copyright &copy; 2026 校园社团成果展示与孵化系统 版权所有</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, watch, computed, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '../api/auth'
import request from '../utils/request'

const router = useRouter()
const route = useRoute()
const userType = ref(route.params.userType || 'student')
watch(() => route.params.userType, (t) => { userType.value = t || 'student'; registerForm.value = { username: '', password: '', confirmPassword: '', realName: '', phone: '', teacherNo: '', email: '', code: '', college: '', field: '', title: '', organization: '', companyName: '', industry: '', address: '' } })

const userTypes = [{ code: 'student', name: '客户端' },{ code: 'teacher', name: '教师端' },{ code: 'admin', name: '管理员端' },{ code: 'expert', name: '专家端' },{ code: 'enterprise', name: '企业端' }]
const switchType = (type) => router.push(`/register/${type}`)
const goBack = () => router.push(`/login/${userType.value}`)

const registerFormRef = ref(null)
const registerForm = ref({ username: '', password: '', confirmPassword: '', realName: '', phone: '', teacherNo: '', email: '', code: '', college: '', field: '', title: '', organization: '', companyName: '', industry: '', address: '' })
const industries = ['信息技术','互联网','金融','教育','制造业','医疗健康','能源环保','其他']
const errorMsg = ref(''), isLoading = ref(false)
const codeSending = ref(false), countdown = ref(0)
let countdownTimer = null
const sendRegisterCode = async () => {
  const email = String(registerForm.value.email || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { ElMessage.warning('请先输入正确的邮箱'); return }
  codeSending.value = true
  try {
    const res = await request.post('/api/auth/send-code', {
      purpose: 'register',
      email,
      username: registerForm.value.username
    })
    ElMessage.success(res.msg || '验证码已发送')
    countdown.value = 60
    clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) clearInterval(countdownTimer)
    }, 1000)
  } catch (e) {
    ElMessage.error(e.msg || '验证码发送失败')
  } finally {
    codeSending.value = false
  }
}
onUnmounted(() => clearInterval(countdownTimer))

const registerRules = computed(() => ({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [{ required: true, message: '请确认密码', trigger: 'blur' }, { validator: (_, v, cb) => { if (v !== registerForm.value.password) cb(new Error('两次密码不一致')); else cb() }, trigger: 'blur' }],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [{ required: userType.value === 'student', message: '请输入手机号', trigger: 'blur' }],
  teacherNo: [{ required: userType.value === 'teacher', message: '请输入教师编号', trigger: 'blur' }],
  email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }, { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  code: [{ required: true, message: '请输入邮箱验证码', trigger: 'blur' }],
  college: [{ required: userType.value === 'student' || userType.value === 'teacher', message: '请选择学院', trigger: 'change' }],
  field: [{ required: userType.value === 'expert', message: '请选择专业领域', trigger: 'change' }],
  title: [{ required: userType.value === 'expert', message: '请输入职称', trigger: 'blur' }],
  organization: [{ required: userType.value === 'expert', message: '请输入所属单位', trigger: 'blur' }],
  companyName: [{ required: userType.value === 'enterprise', message: '请输入企业名称', trigger: 'blur' }],
  industry: [{ required: userType.value === 'enterprise', message: '请选择行业', trigger: 'change' }],
  address: [{ required: userType.value === 'enterprise', message: '请输入企业地址', trigger: 'blur' }]
}))

const handleRegister = async () => {
  try { await registerFormRef.value.validate(); errorMsg.value = ''; isLoading.value = true; await register(userType.value, registerForm.value); ElMessage.success('注册成功！请登录'); router.push(`/login/${userType.value}`) }
  catch (error) { errorMsg.value = error.msg || error.message || '注册失败，请检查填写信息' }
  finally { isLoading.value = false }
}
</script>

<style scoped>
.jd-register { min-height: 100vh; display: flex; flex-direction: column; background: #f4f4f4; }
.jd-header { background: #fff; border-bottom: 1px solid #e8e8e8; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.jd-header__inner { max-width: 1200px; margin: 0 auto; height: 64px; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; }
.jd-header__logo { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.jd-logo-icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #e2231a, #c91623); display: flex; align-items: center; justify-content: center; }
.jd-logo-icon svg { width: 24px; height: 24px; color: #fff; }
.jd-logo-text { font-size: 18px; font-weight: 700; color: #222; }
.jd-header__right { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #666; }
.jd-header__welcome { color: #333; } .jd-header__sep { color: #ddd; }
.jd-header__link { color: #e2231a; cursor: pointer; font-weight: 500; } .jd-header__link:hover { color: #c91623; }

.jd-main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
.jd-container { width: 100%; max-width: 1000px; display: grid; grid-template-columns: 1fr; background: #fff; border-radius: 16px; box-shadow: 0 2px 20px rgba(0,0,0,0.06); overflow: hidden; }
@media (min-width: 768px) { .jd-container { grid-template-columns: 1fr 460px; } }

.jd-banner { display: none; position: relative; min-height: 600px; background: linear-gradient(160deg, #1a1a2e 0%, #16213e 40%, #1a3a5c 70%, #3d1f5c 100%); overflow: hidden; }
@media (min-width: 768px) { .jd-banner { display: flex; align-items: center; justify-content: center; } }
.jd-banner__bg { position: absolute; inset: 0; }
.jd-banner__glow { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }
.jd-banner__glow--1 { top: -10%; left: -20%; width: 400px; height: 400px; background: rgba(226,35,26,0.2); }
.jd-banner__glow--2 { bottom: -10%; right: -15%; width: 350px; height: 350px; background: rgba(99,102,241,0.15); }
.jd-banner__content { position: relative; z-index: 2; text-align: center; padding: 40px; }
.jd-banner__title { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -0.02em; margin-bottom: 8px; }
.jd-banner__subtitle { font-size: 16px; color: rgba(255,255,255,0.5); letter-spacing: 0.1em; margin-bottom: 48px; }
.jd-banner__features { display: flex; flex-direction: column; gap: 16px; }
.jd-feat { display: flex; align-items: center; gap: 14px; padding: 14px 20px; background: rgba(255,255,255,0.06); border-radius: 12px; color: rgba(255,255,255,0.75); font-size: 15px; font-weight: 500; border: 1px solid rgba(255,255,255,0.06); transition: all 0.3s; }
.jd-feat:hover { background: rgba(255,255,255,0.1); transform: translateX(4px); }
.jd-feat__icon { font-size: 22px; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.1); border-radius: 12px; flex-shrink: 0; }

.jd-card { padding: 40px 44px; display: flex; flex-direction: column; overflow-y: auto; }
@media (max-width: 480px) { .jd-card { padding: 28px 24px; } }
.jd-tabs { display: flex; border-bottom: 2px solid #eee; margin-bottom: 28px; }
.jd-tab { flex: 1; padding: 14px 12px; border: none; background: none; font-size: 14px; font-weight: 600; color: #999; cursor: pointer; position: relative; transition: color 0.25s; }
.jd-tab:hover { color: #e2231a; } .jd-tab--active { color: #e2231a; }
.jd-tab--active::after { content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 48px; height: 3px; background: #e2231a; border-radius: 2px; }

.jd-form { display: flex; flex-direction: column; }
.jd-form-item { margin-bottom: 18px; }
.jd-code-row { display: flex; gap: 10px; width: 100%; align-items: stretch; }
.jd-code-row .jd-input { flex: 1; }
.jd-code-btn {
  flex-shrink: 0; min-width: 112px; padding: 0 12px; height: 46px; border-radius: 8px;
  border: 1px solid rgba(43, 90, 237, 0.35); background: rgba(43, 90, 237, 0.06);
  color: var(--color-primary); font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.jd-code-btn:hover:not(:disabled) { background: rgba(43, 90, 237, 0.12); }
.jd-code-btn:disabled { color: #9aa3b5; border-color: #d8dce6; background: #f5f6f8; cursor: not-allowed; }
.jd-input :deep(.el-input__wrapper) { border-radius: 8px; box-shadow: 0 0 0 1px #ddd; padding: 2px 16px; background: #fafafa; transition: all 0.25s; height: 46px; }
.jd-input :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #bbb; background: #fff; }
.jd-input :deep(.el-input.is-focus .el-input__wrapper) { box-shadow: 0 0 0 2px #e2231a; background: #fff; }
.jd-input :deep(.el-input__inner) { font-size: 14px; color: #333; } .jd-input :deep(.el-input__inner::placeholder) { color: #bbb; }
.jd-input-icon { display: flex; align-items: center; }
.jd-input-icon svg { width: 20px; height: 20px; color: #bbb; transition: color 0.25s; }
.jd-input :deep(.el-input.is-focus) .jd-input-icon svg { color: #e2231a; }
.jd-select :deep(.el-select__wrapper) { border-radius: 8px; box-shadow: 0 0 0 1px #ddd; background: #fafafa; transition: all 0.25s; height: 46px; padding: 2px 16px; }
.jd-select :deep(.el-select__wrapper:hover) { box-shadow: 0 0 0 1px #bbb; background: #fff; }
.jd-select :deep(.el-select.is-focus .el-select__wrapper) { box-shadow: 0 0 0 2px #e2231a; background: #fff; }

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

.jd-card__foot { display: flex; justify-content: center; align-items: center; margin-top: 24px; font-size: 14px; }
.jd-card__foot-text { color: #999; } .jd-link { font-size: 13px; color: #999; cursor: pointer; transition: color 0.2s; }
.jd-link:hover { color: #e2231a; } .jd-link--strong { color: #e2231a; font-weight: 600; margin-left: 4px; } .jd-link--strong:hover { color: #c91623; }

.jd-footer { text-align: center; padding: 24px 20px; background: #fff; border-top: 1px solid #eee; }
.jd-footer__links { display: flex; justify-content: center; align-items: center; gap: 12px; font-size: 13px; color: #999; margin-bottom: 8px; }
.jd-footer__links span { color: #ddd; } .jd-footer__links a { color: #999; cursor: pointer; } .jd-footer__links a:hover { color: #e2231a; }
.jd-footer__copy { font-size: 12px; color: #bbb; }
@media (max-width: 767px) { .jd-main { padding: 16px 8px; } .jd-container { border-radius: 12px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); } .jd-tab { font-size: 12px; padding: 12px 6px; } }
/* ===== 玻璃拟态主题对齐（覆盖京东红主题，错误提示红色语义保留） ===== */
.jd-register { background: transparent; }
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
.jd-footer__links a:hover,
.jd-btn-back:hover { color: var(--color-primary); }
.jd-btn-back:hover { border-color: var(--color-primary); }
.jd-input :deep(.el-input__wrapper),
.jd-select :deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 0 1px rgba(43, 90, 237, 0.14);
  border-radius: var(--radius-base);
}
.jd-input :deep(.el-input__wrapper:hover),
.jd-select :deep(.el-select__wrapper:hover) {
  background: #fff;
  box-shadow: 0 0 0 1px rgba(43, 90, 237, 0.28);
}
.jd-input :deep(.el-input.is-focus .el-input__wrapper),
.jd-select :deep(.el-select__wrapper.is-focused) {
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
