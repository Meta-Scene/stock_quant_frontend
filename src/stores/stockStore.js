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
    async toggleFavorite(code) {
      const index = this.favorites.indexOf(code)
      if (index === -1) {
        this.favorites.push(code)
      } else {
        this.favorites.splice(index, 1)
      }

      //保存到indexdb
      await this.saveFavoritesToIndexedDB();
      //向后端
      await this.updateFavorites();
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
    },
    // 保存 favorites 到 IndexedDB
    async saveFavoritesToIndexedDB() {
      await set('favorites', this.favorites.slice());
    },
    // 从 IndexedDB 读取 favorites
    async loadFavoritesFromIndexedDB() {
      const data = await get('favorites');
      if (data) {
        this.favorites = data;
      }
    },
    // 发送 favorites 数组到后端
    async updateFavorites() {
      try {
        const response = await fetch('http://120.27.208.55:10003/add_stock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ stock_code: this.favorites }), // 发送当前的 favorites 数组
        });
        if (response.ok) {
          console.log('Favorites 更新成功');
        } else {
          console.error('更新 favorites 时发生错误');
        }
      } catch (error) {
        console.error('网络错误:', error);
      }
    },
    async init() {
      await this.loadFavoritesFromIndexedDB();
      await this.loadFmarkTotal();
    }
  },
  // 在 store 初始化时加载 favorites
  // async onBeforeMount() {
  //   await this.loadFavoritesFromIndexedDB();
  // }
  // persist:{
  //   pick:['fmark_total','favorites'],
  //   key:'stock'
  // },
})
