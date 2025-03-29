<script setup>
import { onMounted, ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import * as echarts from 'echarts'
// 导入模拟数据
// import { stockData } from '@/data/stockData';
const stockNumber = ref(0)
const stockData = ref([])
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
// 总页数
const totalPage = computed(() => {
  return Math.ceil(stockNumber.value / pageSize)
})
const currentPage = ref(1)
// 日期选择
const selectedDate = ref('2025-03-26')
// 策略选择
const strategyIndex = ref('0')
// 复盘条件选择
const replayIndex = ref('0')
// 大数据分析
const analysisIndex = ref('0')
// 策略名称数组
const strategies = {
  '0': '五日调整',
  '1': '打板策略',
  '2': '日内回转',
  '3': '波段交易',
  '4': '基本面选股',
  '5': '套利交易',
  '6': '专家跟随',
  '7': '财务估值',
};
// 技术指标数组
const conditions = {
  '0': '全部',
  '1': '每日涨停',
  '2': '每日跌停',
  '3': '半年线',
  '4': '年线',
  '5': '强于大盘',
  '6': '弱于大盘',
  '7': '大盘反向',
};
// 大数据分析数组
const analysis = {
  '0': '人气排名',
  '1': '热门板块',
  '2': '强势板块',
}
// 查询买点输入框
const input = ref('')

const selectedCondition = computed(() => {
  return conditions[replayIndex.value] || '';
});
const selectedStrategy = computed(() => {
  return strategies[strategyIndex.value] || '';
});
const selectedAnalysis = computed(() => {
  return analysis[analysisIndex.value] || '';
});

// 提取k线图数据,传入某支股票的grid_data
function splitData(rawData) {
  const date = [], values = [];
  for (let i = 0; i < rawData.length; i++) {
    date.push(rawData[i][0]);
    values.push([
      rawData[i][1], // open
      rawData[i][4], // high
      rawData[i][3], // low
      rawData[i][2], // close
      rawData[i][5], // pct_chg
      rawData[i][6], // vol
      // rawData[i][7], // buy
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
      sum += values[i - j][3]
    }
    // console.log(sum / cnt);
    const avg = (sum / cnt).toFixed(2);
    res.push(Number(avg));
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
  const sv = formatDate(selectedDate.value);
  // const sv = selectedDate.value;
  console.log(1111);

  console.log(selectedDate.value);
  // 买点
  // const buy = data.values.map(v => v[6])

  // console.log(data.date);  // 打印 data.date 数组
  // console.log(selectedDate);  // 打印 selectedDate


  chart.setOption({
    title: { text: stock.name, left: '0' },
    // 交叉线
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
      // formatter: function (params) {
      //   const date = params[0].axisValueLabel;
      //   const name = params[0].seriesName;
      //   const open = params[0].data[0];
      //   const high = params[0].data[1];
      //   const low = params[0].data[2]; // 修改为 low
      //   const close = params[0].data[3];

      //   return `
      //   ${date}<br />

      //   open: ${open}<br />
      //   high: ${high}<br />
      //   low: ${low}<br />
      //   close: ${close}
      // `;
      // }
    },
    // 图例
    // legend: { data: ['日K', 'MA5', 'MA10', 'MA20', 'MA30'] },
    // legend: { data: ['日K', '涨跌幅', 'MA5', 'MA10', '成交量'] },
    legend: { data: ['日K', 'MA5', 'MA10', '成交量'] },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    grid: [
      // { left: '10%', right: '10%', bottom: '15%' },
      {
        left: '13%',
        right: '10%',
        top: 40,
        height: '50%',
        borderColor: '#ccc', // 加框线
        show: true,
      },  // 主图区域
      {
        left: '13%',
        right: '10%',
        top: '75%',
        bottom: '15%',
        height: '18%',
        borderColor: '#ccc',
        show: true,
      }
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
        // name: '成交量',
        splitNumber: 2,
        offset: 3,
        splitLine: { show: false },
        axisLine: { show: false },
      },
      {
        scale: true,  // 第3个 yAxis：涨跌幅,防止原始y轴其他元素变形
        // splitArea: { show: true },
        // name: '涨跌幅',
        axisLabel: {
          show: false,
          formatter: '{value} %',
        },
      }

    ],
    dataZoom: [
      { type: 'inside', start: 0, end: 100, xAxisIndex: [0, 1] },
      { type: 'slider', xAxisIndex: [0, 1], show: true, top: '93%', start: 0, end: 100 },
    ],
    series: [
      {
        name: '日K',
        type: 'candlestick',
        barWidth: '30%',
        data: data.values.map(v => v.slice(0, 4)), // [open, high, low, close]
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: upBorderColor,
          borderColor0: downBorderColor,
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
      },
      {
        name: '涨跌幅',
        type: 'line',
        data: pctChg,
        smooth: true,
        lineStyle: {
          color: '#ffa500',
          width: 1.5,
          opacity: 0
        },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: {
          color: '#ffa500',
          opacity: 0
        },
        tooltip: {
          valueFormatter: function (value) {
            return value.toFixed(2) + '%';
          }
        },
        yAxisIndex: 2,
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
        barWidth: '20%',
        itemStyle: {
          color: '#915764'
        }
      },
      {
        name: '指定日期收盘价',
        type: 'scatter',
        coordinateSystem: 'cartesian2d',
        symbol: 'circle',
        symbolSize: 20,
        data: [
          {
            name: '当前日期',
            value: [data.date.indexOf(sv), data.values[data.date.indexOf(sv)][1]], // selectedDate 为选中的日期
          },
        ],
        itemStyle: {
          color: '#e5e514',
        }
      },
      // {
      //   name: '买点',
      //   type: 'scatter',
      //   coordinateSystem: 'cartesian2d',
      //   symbol: 'circle',
      //   symbolSize: 10,
      //   data: buy,
      //   itemStyle: {
      //     color: '#0e0a03',
      //   }
      // }

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

  });
  charts.value[id] = chart
}

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
    const chart = charts.value[chartDiv.id];
    if (!isFullscreen) {
      wrapper.classList.remove('is-fullscreen')
      wrapper.style.width = ''
      wrapper.style.height = ''
      chartDiv.style.width = '100%'
      chartDiv.style.height = '100%'
      //   nextTick(() => {
      //     chart?.resize();
      //   });
      // } else {
      //   wrapper.classList.add('is-fullscreen')
      //   nextTick(() => {
      //     chart?.resize();
      //   });
      // }
      setTimeout(() => {
        chart?.resize();
      }, 100); // 延迟 100ms
    } else {
      wrapper.classList.add('is-fullscreen');
      setTimeout(() => {
        chart?.resize();
      }, 100);
    }
    if (btn) btn.textContent = isFullscreen ? '×' : '全屏'
  })
}



function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    fetchData();
  }
}

function nextPage() {
  if (currentPage.value < totalPage.value) {
    currentPage.value++;
    fetchData();
  }
}

function gotoPage() {
  const val = parseInt(document.getElementById('gotoInput').value)
  if (val >= 1 && val <= totalPage.value) {
    currentPage.value = val
    fetchData();
  } else {
    alert('页码无效')
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  fetchData();
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// 更新策略类型
const handleStrategy = (key, keyPath) => {
  // console.log(key, keyPath)
  strategyIndex.value = key;
  currentPage.value = 1;
  fetchData();
}
// 更新技术指标
const handleReplay = (key, keyPath) => {
  // console.log(key, keyPath)
  replayIndex.value = key;
  currentPage.value = 1;
  fetchData();
}
// 更新大数据分析
const handleAnalysis = (key, keyPath) => {
  // console.log(key, keyPath)
  analysisIndex.value = key;
  currentPage.value = 1;
  fetchData();
}

function fetchData() {
  const params = new URLSearchParams({
    date: formatDate(selectedDate.value),
    page: currentPage.value,

  });
  // console.log(date);
  // console.log(selectedDate.value);
  let url = 'http://172.16.34.116:321/up_stop'; // 全部
  if (replayIndex.value === '1') {
    url = 'http://172.16.34.116:321/up_stop'; // 涨停
  } else if (replayIndex.value === '2') {
    url = 'http://172.16.34.116:321/down_stop'; // 跌停
  }
  fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    // body: JSON.stringify({
    //   // strategy: selectedStrategy,
    //   // strategyIndex: key,
    //   date: selectedDate.value,
    //   page: currentPage.value,
    // }),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('网络响应失败');
      }
      return response.json();
    })
    .then(data => {
      console.log('成功:', data);
      const grid = data.grid_data || [];
      if (grid.length === 0) {
        currentPage.value = 0;
      }
      const flattened = grid.flat().map(itemList => {
        const name = itemList[0][0] // 股票代码
        const kline = itemList.map(d => [
          d[1],  // 日期
          d[2],  // open
          d[3],  // high
          d[4],  // low
          d[5],  // close
          d[7],  //涨跌幅
          d[8],  //成交量
          // d[9],  //买点
        ])
        return { name, data: kline }
      })
      stockData.value = flattened
      // stockNumber.value = data.total_pages * pageSize
      stockNumber.value = data.stock_count
      // renderCharts();
    })
    .catch(error => {
      console.error('数据获取失败:', error);
    });
}

// function fetchData() {
//   const mockData = {
//     "column_names": [
//       "ts_code", "trade_date", "open", "high",
//       "low", "close", "pre_close", "pct_chg", "vol"],

//     "date": "2024-01-12",

//     "grid_data": [
//       [
//         [
//           ["430017.BJ", "20240111", 14.32, 14.93, 14.03, 14.23, 13.92, 2.23, 30076.77],
//           ["430017.BJ", "20240112", 13.96, 14.14, 13.27, 13.27, 14.23, -6.75, 35741.96],
//           ["430017.BJ", "20240115", 13.23, 13.41, 12.72, 12.75, 13.27, -3.92, 23413.75]],
//         [
//           ["430047.BJ", "20240111", 17.25, 18.5, 17.25, 18.12, 17.08, 6.09, 30244.24],
//           ["430047.BJ", "20240112", 17.94, 18.27, 17.52, 17.66, 18.12, -2.54, 18176.61],
//           ["430047.BJ", "20240115", 17.52, 18.15, 17.52, 17.84, 17.66, 1.02, 15487.43]],
//         [
//           ["430090.BJ", "20240111", 5.01, 5.3, 5.01, 5.12, 5.04, 1.59, 113921.8],
//           ["430090.BJ", "20240112", 5.1, 5.12, 4.39, 4.41, 5.12, -13.87, 195351.01],
//           ["430090.BJ", "20240115", 4.36, 4.44, 4.06, 4.07, 4.41, -7.71, 136154.68]]],
//       [
//         [
//           ["430139.BJ", "20240111", 13.2, 13.6, 13.17, 13.47, 13.19, 2.12, 23430.29],
//           ["430139.BJ", "20240112", 13.35, 13.57, 12.53, 12.55, 13.47, -6.83, 32109.02],
//           ["430139.BJ", "20240115", 12.51, 13.16, 11.95, 12.55, 12.55, 0.0, 34289.83]],
//         [
//           ["430198.BJ", "20240111", 8.96, 9.3, 8.84, 9.05, 8.89, 1.8, 46919.64],
//           ["430198.BJ", "20240112", 9.06, 9.07, 7.87, 7.91, 9.05, -12.6, 71167.1],
//           ["430198.BJ", "20240115", 7.98, 8.0, 7.44, 7.5, 7.91, -5.18, 54171.58]],
//         [
//           ["430300.BJ", "20240111", 12.19, 12.68, 12.19, 12.3, 12.33, -0.24, 22148.13],
//           ["430300.BJ", "20240112", 12.11, 12.35, 10.45, 10.45, 12.3, -15.04, 40485.19],
//           ["430300.BJ", "20240115", 10.45, 10.9, 10.0, 10.34, 10.45, -1.05, 26087.01]]],
//       [
//         [
//           ["430418.BJ", "20240111", 16.23, 16.56, 15.81, 16.25, 16.42, -1.04, 16843.22],
//           ["430418.BJ", "20240112", 16.11, 16.34, 14.53, 14.55, 16.25, -10.46, 27629.35],
//           ["430418.BJ", "20240115", 14.34, 15.09, 13.92, 14.55, 14.55, 0.0, 23918.28]],
//         [
//           ["430425.BJ", "20240111", 16.88, 16.97, 16.42, 16.81, 16.81, 0.0, 16275.92],
//           ["430425.BJ", "20240112", 16.91, 16.91, 14.26, 14.27, 16.81, -15.11, 30662.16],
//           ["430425.BJ", "20240115", 14.07, 14.91, 13.83, 14.08, 14.27, -1.33, 16026.4]],
//         [
//           ["430476.BJ", "20240111", 12.93, 13.24, 12.84, 13.18, 12.93, 1.93, 6864.85],
//           ["430476.BJ", "20240112", 13.25, 13.71, 12.39, 12.45, 13.18, -5.54, 11543.37],
//           ["430476.BJ", "20240115", 12.47, 12.54, 11.81, 11.96, 12.45, -3.94, 10675.44]]]],
//     "page": 1,
//     "total_pages": 27
//   }

//   const grid = mockData.grid_data || []
//   const flattened = grid.flat().map(itemList => {
//     const name = itemList[0][0] // 股票代码
//     const kline = itemList.map(d => [
//       d[1],  // 日期
//       d[2],  // open
//       d[3],  // high
//       d[4],  // low
//       d[5],  // close
//       d[7],  // pct_chg
//       d[8],  // vol


//     ])
//     return { name, data: kline }
//   })

//   stockData.value = flattened
//   stockNumber.value = flattened.length
// }
function formatDate(inputDate) {
  const date = new Date(inputDate);
  // YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}


watch(selectedDate, (newDate) => {
  if (newDate) {
    console.log(selectedDate);
    currentPage.value = 1; // 将当前页码重置为1


    // console.log(newDate);
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
    <div class="top-bar">
      <div class="title-container">
        <h1>{{ selectedCondition }}（{{ stockNumber }}）</h1>
      </div>
      <div class="select-container">
        <div class="column">
          <span class="label">股票代码</span>
          <el-input v-model="input" style="width: 150px" placeholder="输入股票代码" clearable />
        </div>
        <div class="column">
          <span class="label">日期</span>
          <el-date-picker v-model="selectedDate" type="date" placeholder="选择日期" size="small" style="width: 70%" />
        </div>
        <div class=" column">
          <el-menu :default-active="replayIndex" mode="horizontal" class="strategy-menu" @select="handleReplay"
            :ellipsis="false">
            <el-sub-menu index="replay">
              <template #title>技术指标</template>
              <el-menu-item index="0">所有</el-menu-item>
              <el-menu-item index="1">每日涨停</el-menu-item>
              <el-menu-item index="2">每日跌停</el-menu-item>
              <el-menu-item index="3">半年线</el-menu-item>
              <el-menu-item index="4">年线</el-menu-item>
              <el-menu-item index="5">强于大盘</el-menu-item>
              <el-menu-item index="6">弱于大盘</el-menu-item>
              <el-menu-item index="7">大盘反向</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
        <div class="column">
          <el-menu :default-active="analysisIndex" mode="horizontal" class="strategy-menu" @select="handleAnalysis"
            :ellipsis="false">
            <el-sub-menu index="analysis">
              <template #title>大数据分析</template>
              <el-menu-item index="0">人气排名</el-menu-item>
              <el-menu-item index="1">热门板块</el-menu-item>
              <el-menu-item index="2">强势板块</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
        <div class="column">
          <el-menu :default-active="strategyIndex" mode="horizontal" class="strategy-menu" @select="handleStrategy"
            :ellipsis="false">
            <el-sub-menu index="strategy">
              <template #title>策略类型</template>
              <el-menu-item index="0">🟢 五日调整</el-menu-item>
              <el-menu-item index="1">🟡 打板策略</el-menu-item>
              <el-menu-item index="2">🟡 日内回转</el-menu-item>
              <el-menu-item index="3">🟡 波段交易</el-menu-item>
              <el-menu-item index="4">🔴 基本面选股</el-menu-item>
              <el-menu-item index="5">🔴 套利交易</el-menu-item>
              <el-menu-item index="6">🔴 专家跟随</el-menu-item>
              <el-menu-item index="7">🔴 财务估值</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
      </div>
    </div>


    <div class="grid-container">
      <div class="chart-wrapper" v-for="(stock, idx) in stockData" :key="stock.name">
        <div class="chart" :id="`chart${idx}`"></div>
        <button class="fullscreen-btn" @click="fullscreen(idx)">全屏</button>
        <button class="fullscreen-btn" style="right: 80px" @click="exportChart(idx, stock.name)">导出</button>
      </div>
    </div>


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
/* 全局 */
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #f4f6f8;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #333;
}

/* 顶部栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
  padding: 10px 24px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border-radius: 0 0 8px 8px;
}

.title-container h1 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #0d0d0d;
  white-space: nowrap;
}

.select-container {
  display: flex;
  flex: 1;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 16px;
  min-width: 0;
}

.column {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.label {
  font-weight: bold;
  color: #555;
}

.strategy-menu {
  background: transparent;
  border-bottom: none;
  height: 36px;
  line-height: 36px;
}

.strategy-menu .el-sub-menu__title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  padding: 0 10px;
  height: 36px;
  line-height: 36px;
}

/* 菜单选中 */
.el-menu--horizontal>.el-menu-item.is-active,
.el-menu--horizontal>.el-sub-menu.is-active .el-sub-menu__title {
  background-color: #f9f9f9;
  border-radius: 6px;
  font-weight: bold;
  border-bottom: none !important;
  color: #555 !important;
}

.el-menu--horizontal>.el-menu-item:hover,
.el-menu--horizontal>.el-sub-menu:hover .el-sub-menu__title {
  background-color: #ececec;
  border-radius: 6px;
  color: #555;
}

.el-menu--horizontal>.el-menu-item,
.el-menu--horizontal>.el-sub-menu .el-sub-menu__title {
  border-bottom: none !important;
}


/* 图表 */
#app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.chart {
  width: 100% !important;
  height: 100% !important;
  border-radius: 8px;
}

.fullscreen-btn {
  position: absolute;
  top: 8px;
  right: 10px;
  padding: 4px 8px;
  background-color: #2c3e50;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
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
  font-size: 14px;
  padding: 6px 10px;
}

/* 分页栏 */
.controls {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 6px 10px;
  gap: 10px;
  height: 40px;
  font-size: 14px;
  background-color: #ffffff;
  border-top: 1px solid #eee;
}

.controls button {
  padding: 4px 10px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #ccc;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.controls input {
  height: 26px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
</style>
