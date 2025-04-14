import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useStockStore = defineStore('stock', () => {
  const stockNumber = ref(0)//总数
  const stockData = ref([])//数据
  // 图表实例
const charts = ref({});
// // 引用图表容器
// const chartContainer = ref(null);

})
