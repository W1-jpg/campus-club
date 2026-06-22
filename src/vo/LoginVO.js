import LoginVO from './LoginVO';
import axios from 'axios';

// 登录请求方法（以学生登录为例）
async function loginStudent(username, password) {
    // 1. 创建 LoginVO 实例（自动 trim 空格）
    const loginVO = new LoginVO(username, password);

    // 2. 前端参数校验（拦截非法请求）
    const validateResult = loginVO.validate();
    if (!validateResult.valid) {
        alert(validateResult.message); // 或前端弹窗提示
        return;
    }

    // 3. 提交请求到后端
    try {
        const response = await axios.post('/api/auth/login/student', loginVO);
        // 4. 正确处理后端响应
        if (response.data && response.data.code === 200) {
            // 登录成功：保存 Token，跳转页面
            localStorage.setItem('token', response.data.data);
            alert('登录成功！');
            window.location.href = '/home'; // 跳转到首页
        } else {
            // 后端返回错误（如用户不存在、密码错误）
            alert(response.data?.message || '登录失败');
        }
    } catch (error) {
        // 网络错误/后端异常
        alert(error.response?.data?.message || '登录失败，请重试');
    }
}