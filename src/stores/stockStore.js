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
    pick:['fmark_total'],
    key:'stock'
  },
})
