// import { defineStore } from 'pinia'

// export default defineStore('stock', {
//   state:() => {
//     return{
//       stockNumber:0,
//       stockData:[],
//       charts:{},
//       currentPage:1,
//       selectedDate:'',
//       strategyIndex:'0',
//       replayIndex:'1',
//       analysisIndex:'0',
//       stockSearch:'',
//       fmark_total:[],
//     }
//   },
//   persist:{
//     pick:['fmark_total'],
//     key:'stock'
//   },
// })

import { defineStore } from 'pinia'

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
  },

  persist:{
    pick:['fmark_total','favorites'],
    key:'stock'
  },
})
