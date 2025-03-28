<script setup>
import { onMounted, ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
// 导入模拟数据
// import { stockData } from '@/data/stockData';
const stockNumber = ref(0)
const stockData = ref([
  // {
  //   name: '430017.BJ',
  //   data: [
  //     ['20240111', 14.32, 14.93, 14.03, 14.23],
  //     ['20240112', 13.96, 14.14, 13.27, 13.27],
  //     ['20240115', 13.23, 13.41, 12.72, 12.75],
  //   ]
  // },
  // 可以继续添加更多项
])
// 颜色
const upColor = '#ec0000';
const upBorderColor = '#8A0000';
const downColor = '#00da3c';
const downBorderColor = '#008F28';
// 图表实例
const charts = ref({});
// 引用图表容器
const chartContainer = ref(null);
// 每页大小
const pageSize = 9;
// const totalPage = ref(Math.ceil(stockData.length / pageSize));
// 总页数
const totalPage = computed(() => {
  return Math.ceil(stockNumber.value / pageSize)
})
// let currentPage = 1;
const currentPage = ref(1)
// 日期选择
const selectedDate = ref('')
// 策略选择
const defaultIndex = ref('0')

// 策略名称数组
const strategies = {
  '0': '全部',
  '1-1': '涨停',
  '1-2': '跌停',
  '1-3': '五日变化',
  '2-1': '条件2-子1',
  '2-2': '条件2-子2',
  '2-3': '条件2-子3',
  '3-1': '条件3-子1',
  '3-2': '条件3-子2',
  '3-3': '条件3-子3',
};

const selectedStrategy = computed(() => {
  return strategies[defaultIndex.value] || '';
});

// 提取k线图数据,传入某支股票的grid_data
function splitData(rawData) {
  const date = [], values = [];
  for (let i = 0; i < rawData.length; i++) {
    date.push(rawData[i][0]);
    // values.push(rawData[i].slice(1));
    values.push([
      rawData[i][1], // open
      rawData[i][2], // high
      rawData[i][3], // low
      rawData[i][4], // close
      rawData[i][5], // pct_chg
      rawData[i][6], // vol
    ])
  }
  return { date, values };
  /*
  values[i][0-3] 开盘 最高 最低 收盘
  values[i][4] 涨跌幅
  values[i][5] 成交量
  */
}

// 计算均线
function MA(cnt, data) {
  const res = [];
  const values = data.values;
  for (let i = 0; i < values.length; i++) {
    // 不足cnt天跳过
    if (i < cnt - 1) {
      res.push('-')
      continue
    }
    // 每cnt天收盘价总和
    let sum = 0
    for (let j = 0; j < cnt; j++) {
      // d[5]收盘价
      sum += values[i - j][5]
    }
    res.push(sum / cnt)
  }
  return res
}

// 单图表初始化
function initChart(id, stock) {
  const data = splitData(stock.data)
  const chart = echarts.init(document.getElementById(id))
  // 提取成交量和涨跌幅
  const pctChg = data.values.map(v => v[4])
  const volumes = data.values.map(v => v[5])

  chart.setOption({
    title: { text: stock.name, left: '0' },
    // 交叉线
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    // 图例
    // legend: { data: ['日K', 'MA5', 'MA10', 'MA20', 'MA30'] },
    legend: { data: ['日K', '涨跌幅', 'MA5', 'MA10', '成交量'] },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    grid: [
      // { left: '10%', right: '10%', bottom: '15%' },
      { left: '10%', right: '10%', height: '60%' },  // 主图区域
      { left: '10%', right: '10%', top: '70%', height: '20%' } // 成交量区域
    ],
    xAxis: [
      {
        data: data.date,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
      },
      {
        type: 'category',
        gridIndex: 1,
        data: data.date,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false }
      }
    ],
    yAxis: [
      {
        scale: true,
        splitArea: { show: true },
      },
      {
        gridIndex: 1,
        name: '成交量',
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      { type: 'inside', start: 50, end: 100 },
      { show: true, type: 'slider', top: '90%', start: 50, end: 100 },
    ],
    series: [
      {
        name: '日K',
        type: 'candlestick',
        data: data.values.map(v => v.slice(0, 4)), // [open, high, low, close]
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: upBorderColor,
          borderColor0: downBorderColor,
        },
      },
      {
        name: '涨跌幅',
        type: 'line',
        data: pctChg,
        smooth: true,
        lineStyle: {
          color: '#ffa500',
          width: 1.5,
        },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: {
          color: '#ffa500',
        },
      },

      {
        name: 'MA5',
        type: 'line',
        data: MA(5, data),
        smooth: true,
        lineStyle: {
          color: '#ff6347',
          width: 1.5
        },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: {
          color: '#ff6347',
        },
      },
      {
        name: 'MA10',
        type: 'line',
        data: MA(10, data),
        smooth: true,
        lineStyle: {
          color: '#4682b4',
          width: 1.5,
        },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: {
          color: '#4682b4',
        },
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        itemStyle: {
          color: '#a0a0a0'
        }
      }
      // {
      //   name: 'MA20',
      //   type: 'line',
      //   data: MA(20, data),
      //   smooth: true,
      //   lineStyle: {
      //     color: '#32cd32',
      //     width: 1.5,
      //   },
      //   symbol: 'circle',
      //   symbolSize: 5,
      //   itemStyle: {
      //     color: '#32cd32',
      //   },
      // },
      // {
      //   name: 'MA30',
      //   type: 'line',
      //   data: MA(30, data),
      //   smooth: true,
      //   lineStyle: {
      //     color: '#ffa500',
      //     width: 1.5,
      //   },
      //   symbol: 'circle',
      //   symbolSize: 5,
      //   itemStyle: {
      //     color: '#ffa500',
      //   },
      // },
    ],
  })
  charts.value[id] = chart
}
// 11111111111111111111111
// function renderCharts() {
//   if (!chartContainer.value) return
//   chartContainer.value.innerHTML = '' // 清空容器
//   // const start = (currentPage.value - 1) * pageSize
//   // const pageData = stockData.slice(start, start + pageSize)
//   // const pageData = stockData.value


//   pageData.forEach((stock, idx) => {
//     const wrapper = document.createElement('div')
//     wrapper.className = 'chart-wrapper'

//     const chartDiv = document.createElement('div')
//     const chartId = `chart${idx}`
//     chartDiv.className = 'chart'
//     chartDiv.id = chartId

//     const btnFull = document.createElement('button')
//     btnFull.className = 'fullscreen-btn'
//     btnFull.textContent = '全屏'

//     btnFull.onclick = () => {
//       if (!document.fullscreenElement) {
//         wrapper.classList.add('is-fullscreen')
//         wrapper.requestFullscreen?.().then(() => {
//           const chart = charts.value[chartId]
//           if (chart) chart.resize() //进入后 resize
//         })
//       } else {
//         document.exitFullscreen?.()
//       }
//     }

//     const btnExport = document.createElement('button')
//     btnExport.className = 'fullscreen-btn'
//     btnExport.style.right = '80px'
//     btnExport.textContent = '导出'
//     // 添加导出按钮的逻辑
//     btnExport.onclick = () => {
//       const chart = charts.value[chartId]
//       const img = chart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
//       const a = document.createElement('a')
//       a.href = img
//       a.download = `${stock.name}.png`
//       a.click()
//     }

//     wrapper.appendChild(chartDiv)
//     wrapper.appendChild(btnFull)
//     wrapper.appendChild(btnExport)
//     chartContainer.value.appendChild(wrapper)

//     initChart(chartId, stock)
//   })

// // document.getElementById('currentPage').textContent = currentPage
//   currentPage.value = currentPage.value;
// }

function fullscreen(idx) {
  const wrapper = document.querySelectorAll('.chart-wrapper')[idx]
  const chart = charts.value[`chart${idx}`]
  if (!document.fullscreenElement) {
    wrapper.classList.add('is-fullscreen')
    wrapper.requestFullscreen?.().then(() => chart?.resize())
  } else {
    document.exitFullscreen?.()
  }
}

function exportChart(idx, name) {
  const chart = charts.value[`chart${idx}`]
  const img = chart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })
  const a = document.createElement('a')
  a.href = img
  a.download = `${name}.png`
  a.click()
}

function handleFullscreenChange() {
  const isFullscreen = !!document.fullscreenElement
  document.querySelectorAll('.chart-wrapper').forEach((wrapper) => {
    const btn = wrapper.querySelector('.fullscreen-btn')
    const chartDiv = wrapper.querySelector('.chart')
    if (!isFullscreen) {
      wrapper.classList.remove('is-fullscreen')
      wrapper.style.width = ''
      wrapper.style.height = ''
      chartDiv.style.width = '100%'
      chartDiv.style.height = '100%'
      wrapper.offsetHeight
      const chart = charts.value[chartDiv.id]
      if (chart) chart.resize()
    } else {
      wrapper.classList.add('is-fullscreen')
    }
    if (btn) btn.textContent = isFullscreen ? '×' : '全屏'
  })
}



function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchData();
    // renderCharts();
  }
}

function nextPage() {
  if (currentPage.value < totalPage.value) {
    currentPage.value++;
    fetchData();
    // renderCharts();
  }
}

function gotoPage() {
  const val = parseInt(document.getElementById('gotoInput').value)
  if (val >= 1 && val <= totalPage.value) {
    currentPage.value = val
    fetchData();
    // renderCharts()
  } else {
    alert('页码无效')
  }
}

// document.addEventListener('fullscreenchange', () => {
//   const isFullscreen = !!document.fullscreenElement

//   document.querySelectorAll('.chart-wrapper').forEach((wrapper) => {
//     const btn = wrapper.querySelector('.fullscreen-btn')
//     const chartDiv = wrapper.querySelector('.chart')

//     if (!isFullscreen) {
//       wrapper.classList.remove('is-fullscreen')

//       // 重置图表容器尺寸
//       wrapper.style.width = ''
//       wrapper.style.height = ''
//       chartDiv.style.width = '100%'
//       chartDiv.style.height = '100%'

//       // 强制 layout 重计算
//       wrapper.offsetHeight

//       // 让 ECharts 重绘
//       const chart = charts.value[chartDiv.id]
//       if (chart) chart.resize()
//     } else {
//       wrapper.classList.add('is-fullscreen')
//     }

//     // 切换按钮内容
//     if (btn) {
//       btn.textContent = isFullscreen ? '×' : '全屏'
//     }
//   })
// })
// renderCharts();
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  fetchData();
  // renderCharts()
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// const size = (ref < 'default') | 'large' | ('small' > 'default')

// 更新策略
const handleSelect = (key, keyPath) => {
  // console.log(key, keyPath)
  defaultIndex.value = key;
  currentPage.value = 1;
  fetchData();
}

// function fetchData() {
//   fetch('http://172.16.34.116/', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       // strategy: selectedStrategy,
//       // strategyIndex: key,
//       date: selectedDate.value,
//       page: currentPage.value,
//     }),
//   })
//     .then(response => {
//       if (!response.ok) {
//         throw new Error('网络响应失败');
//       }
//       return response.json();
//     })
//     .then(data => {
//       console.log('成功:', data);
//       const grid = data.grid_data || [];
//       const flattened = grid.flat().map(itemList => {
//         const name = itemList[0][0] // 股票代码
//         const kline = itemList.map(d => [
//           d[1],  // 日期
//           d[2],  // open
//           d[3],  // high
//           d[4],  // low
//           d[5],  // close
//           d[7],  //涨跌幅
//           d[8],  //成交量
//         ])
//         return { name, data: kline }
//       })
//       stockData.value = flattened
//       stockNumber.value = data.total_pages * pageSize
//       // renderCharts();
//     })
//     .catch(error => {
//       console.error('数据获取失败:', error);
//     });
// }

function fetchData() {
  const mockData = {
    "column_names": [
      "ts_code", "trade_date", "open", "high",
      "low", "close", "pre_close", "pct_chg", "vol"],

    "date": "2024-01-12",

    "grid_data": [
      [
        [
          ["430017.BJ", "20240111", 14.32, 14.93, 14.03, 14.23, 13.92, 2.23, 30076.77],
          ["430017.BJ", "20240112", 13.96, 14.14, 13.27, 13.27, 14.23, -6.75, 35741.96],
          ["430017.BJ", "20240115", 13.23, 13.41, 12.72, 12.75, 13.27, -3.92, 23413.75]],
        [
          ["430047.BJ", "20240111", 17.25, 18.5, 17.25, 18.12, 17.08, 6.09, 30244.24],
          ["430047.BJ", "20240112", 17.94, 18.27, 17.52, 17.66, 18.12, -2.54, 18176.61],
          ["430047.BJ", "20240115", 17.52, 18.15, 17.52, 17.84, 17.66, 1.02, 15487.43]],
        [
          ["430090.BJ", "20240111", 5.01, 5.3, 5.01, 5.12, 5.04, 1.59, 113921.8],
          ["430090.BJ", "20240112", 5.1, 5.12, 4.39, 4.41, 5.12, -13.87, 195351.01],
          ["430090.BJ", "20240115", 4.36, 4.44, 4.06, 4.07, 4.41, -7.71, 136154.68]]],
      [
        [
          ["430139.BJ", "20240111", 13.2, 13.6, 13.17, 13.47, 13.19, 2.12, 23430.29],
          ["430139.BJ", "20240112", 13.35, 13.57, 12.53, 12.55, 13.47, -6.83, 32109.02],
          ["430139.BJ", "20240115", 12.51, 13.16, 11.95, 12.55, 12.55, 0.0, 34289.83]],
        [
          ["430198.BJ", "20240111", 8.96, 9.3, 8.84, 9.05, 8.89, 1.8, 46919.64],
          ["430198.BJ", "20240112", 9.06, 9.07, 7.87, 7.91, 9.05, -12.6, 71167.1],
          ["430198.BJ", "20240115", 7.98, 8.0, 7.44, 7.5, 7.91, -5.18, 54171.58]],
        [
          ["430300.BJ", "20240111", 12.19, 12.68, 12.19, 12.3, 12.33, -0.24, 22148.13],
          ["430300.BJ", "20240112", 12.11, 12.35, 10.45, 10.45, 12.3, -15.04, 40485.19],
          ["430300.BJ", "20240115", 10.45, 10.9, 10.0, 10.34, 10.45, -1.05, 26087.01]]],
      [
        [
          ["430418.BJ", "20240111", 16.23, 16.56, 15.81, 16.25, 16.42, -1.04, 16843.22],
          ["430418.BJ", "20240112", 16.11, 16.34, 14.53, 14.55, 16.25, -10.46, 27629.35],
          ["430418.BJ", "20240115", 14.34, 15.09, 13.92, 14.55, 14.55, 0.0, 23918.28]],
        [
          ["430425.BJ", "20240111", 16.88, 16.97, 16.42, 16.81, 16.81, 0.0, 16275.92],
          ["430425.BJ", "20240112", 16.91, 16.91, 14.26, 14.27, 16.81, -15.11, 30662.16],
          ["430425.BJ", "20240115", 14.07, 14.91, 13.83, 14.08, 14.27, -1.33, 16026.4]],
        [
          ["430476.BJ", "20240111", 12.93, 13.24, 12.84, 13.18, 12.93, 1.93, 6864.85],
          ["430476.BJ", "20240112", 13.25, 13.71, 12.39, 12.45, 13.18, -5.54, 11543.37],
          ["430476.BJ", "20240115", 12.47, 12.54, 11.81, 11.96, 12.45, -3.94, 10675.44]]]],
    "page": 1,
    "total_pages": 27
  }

  const grid = mockData.grid_data || []
  const flattened = grid.flat().map(itemList => {
    const name = itemList[0][0] // 股票代码
    const kline = itemList.map(d => [
      d[1],  // 日期
      d[2],  // open
      d[3],  // high
      d[4],  // low
      d[5],  // close
      d[7],  // pct_chg
      d[8],  // vol
    ])
    return { name, data: kline }
  })

  stockData.value = flattened
  stockNumber.value = flattened.length
}



watch(selectedDate, (newDate) => {
  if (newDate) {
    // console.log(selectedDate);
    fetchData();
  }
});

// 当 stockData 更新，重新初始化所有图表
watch(stockData, () => {
  nextTick(() => {
    stockData.value.forEach((stock, idx) => {
      const id = `chart${idx}`
      initChart(id, stock)
    })
  })
})
</script>

<template>
  <div id="app">
    <div class="demo-date-picker">
      <div class="title-container">
        <h1>{{ selectedStrategy }} ({{ stockNumber }})</h1>
      </div>
      <div class="select-container">
        <div class="column column1">
          <span class="demonstration">日期</span>
          <el-date-picker v-model="selectedDate" type="date" placeholder="选择一个日期" />
        </div>
        <div class="column column2">
          <el-menu :default-active="defaultIndex" class="el-menu-demo" mode="horizontal" :ellipsis="false"
            @select="handleSelect">
            <el-sub-menu index="main">
              <template #title>筛选</template>
              <el-menu-item index="0">全部</el-menu-item>
              <el-sub-menu index="1">
                <template #title>策略</template>
                <el-menu-item index="1-1">涨停</el-menu-item>
                <el-menu-item index="1-2">跌停</el-menu-item>
                <el-menu-item index="1-3">五日变化</el-menu-item>
              </el-sub-menu>
              <el-sub-menu index="2">
                <template #title>条件2</template>
                <el-menu-item index="2-1">子1</el-menu-item>
                <el-menu-item index="2-2">子2</el-menu-item>
                <el-menu-item index="2-3">子3</el-menu-item>
              </el-sub-menu>
              <el-sub-menu index="3">
                <template #title>条件3</template>
                <el-menu-item index="3-1">子1</el-menu-item>
                <el-menu-item index="3-2">子2</el-menu-item>
                <el-menu-item index="3-3">子3</el-menu-item>
              </el-sub-menu>
            </el-sub-menu>
          </el-menu>
        </div>
      </div>
    </div>

    <!-- <div class="grid-container" ref="chartContainer"></div> -->
    <div class="grid-container">
      <div class="chart-wrapper" v-for="(stock, idx) in stockData" :key="stock.name">
        <div class="chart" :id="`chart${idx}`"></div>
        <button class="fullscreen-btn" @click="fullscreen(idx)">全屏</button>
        <button class="fullscreen-btn" style="right: 80px" @click="exportChart(idx, stock.name)">导出</button>
      </div>
    </div>

    <!-- 2222222222222222222222222222222222 -->
    <div class="controls">
      <button @click="prevPage()">上一页</button>
      <span>第 <span>{{ currentPage }}</span> /
        <span> {{ totalPage }}</span> 页</span>
      <button @click="nextPage()">下一页</button>
      <input type="number" id="gotoInput" style="width: 60px" placeholder="页码" />
      <button @click="gotoPage()">跳转</button>
    </div>
  </div>
  <!-- <RouterView /> -->
</template>

<style>
.el-menu .el-sub-menu .el-sub-menu__title {
  font-size: 16px;
  /* 设置字体大小 */
  font-weight: bold;
}

.el-menu--horizontal>.el-menu-item:nth-child(1) {
  margin-right: auto;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
}

.chart-wrapper:fullscreen {
  background-color: #fff;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 10px;
}

.controls {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  gap: 10px;
  height: 50px;
}

.grid-container {
  flex: 1 1 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 10px;
  padding: 10px;
  box-sizing: border-box;
  overflow: hidden;
  min-height: 0;
  /* 防止溢出撑高 */
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.chart {
  width: 100% !important;
  height: 100% !important;
  border: 1px solid #ccc;
}

.fullscreen-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 5px 10px;
  background-color: #2c3e50;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  z-index: 10;
}

.fullscreen-btn:hover {
  background-color: #34495e;
}

.chart-wrapper.is-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999;
  background-color: #fff;
}

.chart-wrapper.is-fullscreen .chart {
  height: 100vh !important;
}

.chart-wrapper.is-fullscreen .fullscreen-btn {
  font-size: 16px;
  padding: 8px 14px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 10px;
  border-top: 1px solid #eee;
}

.pagination button {
  padding: 6px 12px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid #ccc;
  background-color: #f8f8f8;
}

.pagination span {
  font-size: 14px;
}

.demo-date-picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-left: 20px;
  margin-right: 50px;
}

h1 {
  margin: 5px;
}

.select-container {
  display: flex;
  gap: 20px;
  margin-top: 5px;
}

.column {
  display: flex;
  flex-direction: row;
}

.column1 {
  margin-top: 15px;
  margin-right: 50px;
}

.column2 {
  margin-right: 50px;
  margin-top: 3px;
}

.demonstration {
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
  margin-top: 5px;
}
</style>
