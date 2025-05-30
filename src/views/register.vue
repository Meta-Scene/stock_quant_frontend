<template>
  <div class="register-wrapper">
    <form @submit.prevent="handleSubmit" class="register-container" novalidate>
      <h1>注册新用户</h1>
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          id="username"
          v-model="username"
          type="text"
          placeholder="请输入用户名"
          required
        />
      </div>
      <div class="form-group">
        <label for="account">账号</label>
        <input
          id="account"
          v-model="account"
          type="text"
          placeholder="请输入账号"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="请输入密码"
          required
        />
      </div>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <button type="submit">注册</button>
      <p class="login-link">
        已有账号？<router-link to="/">登录</router-link>
      </p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import useStockStore from '@/stores/stockStore';

const router = useRouter();
const store = useStockStore();
const username = ref('');
const password = ref('');
const account = ref('');
const errorMessage = ref('');

const handleSubmit = async () => {
  const success = await store.register(username.value,account.value, password.value);
  if (success) {
    router.push('/'); // 注册成功后跳转到登录页面
  } else {
    errorMessage.value = '注册失败，请重试';
  }
};
</script>

<style scoped>
.register-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 98vh;
  background-color: #f5f5f5;
}

.register-container {
  width: 320px;
  background: #ffffff;
  padding: 2rem;
  border-radius: 8px;
}

.register-container h1 {
  margin: 0 0 1.5rem;
  font-size: 1.5rem;
  text-align: center;
  color: #333333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #555555;
}

input {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid #cccccc;
  border-radius: 4px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

input:focus {
  border-color: #007bff;
  outline: none;
}

button {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  color: #ffffff;
  background: #007bff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

button:hover {
  background: #0056b3;
}

.error {
  color: #e91e63;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  text-align: center;
}

.login-link {
  margin-top: 1rem;
  text-align: center;
  font-size: 0.875rem;
}

.login-link a {
  color: #007bff;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>
