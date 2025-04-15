import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/trading.vue'),
    },
    {
      path: '/StockFmark',
      name: 'StockFmark',
      component: ()=>import('@/views/fmark.vue'),
      props: route => ({ stockCode: route.query.stockCode }),
    },
  ],
})

export default router
