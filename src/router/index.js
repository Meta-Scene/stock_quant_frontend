import { createRouter, createWebHistory } from 'vue-router';
import StockDetail from '../pages/index.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/index.vue'),
    },
    {
      path: '/StockDetail',
      name: 'StockDetail',
      component: ()=>import('@/pages/index.vue'),
      props: route => ({ stockCode: route.query.stockCode }),
    },
  ],
})

export default router
