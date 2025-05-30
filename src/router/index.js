import { createRouter, createWebHistory } from 'vue-router';
// import { useStockStore } from '@/stores/stockStore';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/trading',
      name: 'Trading',
      component: () => import('@/views/trading.vue'),
      // meta: { requiresAuth: true }, // 需要登录
    },
    {
      path: '/StockFmark',
      name: 'StockFmark',
      component: ()=>import('@/views/fmark.vue'),
      // meta: { requiresAuth: true }, // 需要登录
      props: route => ({ stockCode: route.query.stockCode }),
    },
    {
      path: '/',
      name: 'Login',
      component: ()=>import('@/views/login.vue'),
    },
  ],
});

// // 路由守卫
// router.beforeEach((to, from, next) => {
//   const store = useStockStore();
//   const isAuthenticated = !!store.user; // 判断是否已登录

//   if (to.meta.requiresAuth && !isAuthenticated) {
//     // 如果未登录且访问需要登录的页面，则跳转到登录页面
//     next({ name: 'Login' });
//   } else if (to.name === 'Login' && isAuthenticated) {
//     // 如果已登录且访问登录页面，则跳转到首页
//     next({ name: 'Trading' });
//   } else {
//     next(); // 继续导航
//   }
// });

export default router
