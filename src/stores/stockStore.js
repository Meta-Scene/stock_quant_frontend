import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { pageSize } from './define'

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
      stockCode:'',
    }
  }
})
