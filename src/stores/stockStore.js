import { defineStore } from 'pinia'
import { set, get } from 'idb-keyval'

const BASE = 'http://120.27.208.55:10002';

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
    /** 拉取所有自选股 **/
    async loadCollectsFromServer() {
      const res = await fetch(`${BASE}/collect/all`, { method: 'GET' })
      if (!res.ok) throw new Error('拉取自选股失败')
      this.favorites = await res.json()
    },

    /** 添加自选股 **/
    async addCollect(code) {
      const res = await fetch(`${BASE}/collect/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // body: JSON.stringify({ ts_code: code })
      })
      if (!res.ok) throw new Error('添加自选股失败')
      this.favorites.push(code)
    },
    /** 删除自选股 **/
    async removeCollect(code) {
      const res = await fetch(`${BASE}/collect/${encodeURIComponent(code)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('删除自选股失败')
      this.favorites = this.favorites.filter(c => c !== code)
    },
    /** 切换收藏状态 **/
    async toggleFavorite(code) {
      try {
        if (this.favorites.includes(code)) {
          console.log(`Removing ${code} from favorites`);
          await this.removeCollect(code);
        } else {
          console.log(`Adding ${code} to favorites`);
          await this.addCollect(code);
        }
        console.log('Updated favorites:', this.favorites);
      } catch (err) {
        console.error('Error toggling favorite:', err);
      }
    },
    /** 判断是否已收藏 **/
    isFavorited(code) {
      return this.favorites.includes(code)
    },
    // 保存 fmark_total 到 IndexedDB
    async saveFmarkTotal() {
      await set('fmark_total', this.fmark_total.slice());
    },
    // 从 IndexedDB 读取 fmark_total
    async loadFmarkTotal() {
      const data = await get('fmark_total');
      if (data) {
        this.fmark_total = data;
      }
    },
    // // 保存 favorites 到 IndexedDB
    // async saveFavoritesToIndexedDB() {
    //   await set('favorites', this.favorites.slice());
    // },
    // // 从 IndexedDB 读取 favorites
    // async loadFavoritesFromIndexedDB() {
    //   const data = await get('favorites');
    //   if (data) {
    //     this.favorites = data;
    //   }
    // },
    // // 发送 favorites 数组到后端
    // async updateFavorites() {
    //   try {
    //     const response = await fetch('http://120.27.208.55:10003/add_stock', {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //       },
    //       body: JSON.stringify({ stock_code: this.favorites }), // 发送当前的 favorites 数组
    //     });
    //     if (response.ok) {
    //       console.log('Favorites 更新成功');
    //     } else {
    //       console.error('更新 favorites 时发生错误');
    //     }
    //   } catch (error) {
    //     console.error('网络错误:', error);
    //   }
    // },
    async init() {
      // await this.loadFavoritesFromIndexedDB();
      await this.loadCollectsFromServer().catch(console.error);
      await this.loadFmarkTotal();
    }
  },
})
