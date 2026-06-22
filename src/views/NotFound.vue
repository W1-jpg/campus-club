<template>
  <div class="not-found">
    <div class="not-found-content">
      <h1>404</h1>
      <p>抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="$router.push('/student-home')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-page);
}
.not-found-content {
  text-align: center;
}
h1 {
  font-size: 80px;
  color: var(--color-primary);
  margin-bottom: 20px;
}
p {
  font-size: var(--font-size-xl);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xxl);
}
</style>
