import { defineStore } from 'pinia'

export default defineStore('stock', {
  state:() => {
    return{
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
    }
  },
  persist:{
    key:"stock",
    paths: ['fmark_total'], // ✅ 只持久化 fmark_total
    storage: localStorage,
  }
})
