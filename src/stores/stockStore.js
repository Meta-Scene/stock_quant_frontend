import { defineStore } from 'pinia'
import { set, get } from 'idb-keyval'
export default defineStore('stock', {
  state:() => ({
      stockNumber:0,
      stockData:[],
      charts:{},
      currentPage:1,
      selectedDate:'',
      strategyIndex:'0',
      replayIndex:'1',
      analysisIndex:'0',
      stockSearch:'',
      fmark_total:[],
      favorites:[],//自选股
  }),
  actions: {
    toggleFavorite(code) {
      const index = this.favorites.indexOf(code)
      if (index === -1) {
        this.favorites.push(code)
      } else {
        this.favorites.splice(index, 1)
      }
    },
    isFavorited(code) {
      return this.favorites.includes(code)
    },
    // 新增：保存 fmark_total 到 IndexedDB
    async saveFmarkTotal() {
      await set('fmark_total', this.fmark_total.slice());
    },
    // 新增：从 IndexedDB 读取 fmark_total
    async loadFmarkTotal() {
      const data = await get('fmark_total');
      if (data) {
        this.fmark_total = data;
      }
    }
  },

  // persist:{
  //   pick:['fmark_total','favorites'],
  //   key:'stock'
  // },
})
