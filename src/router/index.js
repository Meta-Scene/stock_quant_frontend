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
      component: StockDetail,
      props: true,
    },
  ],
})

export default router
