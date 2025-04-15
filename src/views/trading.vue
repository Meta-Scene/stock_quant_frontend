<script setup>
import * as echarts from 'echarts'
import { onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import useStockStore from '@/stores/stockStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { formatDate } from '@/utils/dateUtils';
import { splitData } from '@/utils/splitData';
import { MA } from '@/utils/MA';
import { pageSize, upColor, upBorderColor, downColor, downBorderColor, strategies, conditions, analysis } from '@/stores/define'

const router = useRouter();
const store = useStockStore();
const {
  stockNumber,
  stockData,
  charts,
  currentPage,
  selectedDate,
  strategyIndex,
  replayIndex,
  analysisIndex,
  stockCode,
} = storeToRefs(store);
const totalPage = computed(() => {
  return Math.ceil(stockNumber.value / pageSize)
})
let gotoInput;//页码跳转框

/* 点击股票代码跳转到对应顶/底分型数据显示 */
function showDetail(stock) {
  console.log("stockCode: ", stock.name);
  window.open(
    router.resolve({
      name: 'StockFmark',
      query: {
        stockCode: stock.name,
      },
    }).href, '_blank'
  );
}
/* 监听股票代码按回车键进行查询 */
const onStockCodeInput = () => {
  selectedDate.value = ''
  fetchData()
}
/* 计算选中的复盘条件、策略和大数据分析 */
const selectedCondition = computed(() => {
  return conditions[replayIndex.value] || '';
});
const selectedStrategy = computed(() => {
  return strategies[strategyIndex.value] || '';
});
const selectedAnalysis = computed(() => {
  return analysis[analysisIndex.value] || '';
});
/* 单图表初始化 */
function initChart(id, stock) {
  if (charts.value[id]) {
    charts.value[id].dispose();
  }
  const data = splitData(stock.data)
  const chart = echarts.init(document.getElementById(id))
  // 提取成交量和涨跌幅
  const pctChg = data.values.map(v => v[4])
  const volumes = data.values.map(v => v[5])
  const buy = data.values.map(v => v[6])
  const sv = formatDate(selectedDate.value);
  // 当前日期高亮显示
  const currentDateSeries = stockCode.value.trim() === '' ? [{
    name: '指定日期收盘价',
    type: 'scatter',
    coordinateSystem: 'cartesian2d',
    symbol: 'circle',
    symbolSize: 20,
    data: [
      {
        name: '当前日期',
        value: [data.date.indexOf(sv), data.values[data.date.indexOf(sv)][1]],
      },
    ],
    itemStyle: {
      color: '#e5e514',
    }
  }
  ] : [];

  chart.setOption({
    title: { text: stock.name, left: '0', triggerEvent: true },
    // 交叉线
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
    },
    // 图例
    legend: { data: ['日K', 'MA5', 'MA10'] },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    grid: [
      {
        left: '13%',
        right: '10%',
        top: 40,
        height: '50%',
        borderColor: '#ccc',
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
        splitNumber: 2,
        offset: 3,
        splitLine: { show: false },
        axisLine: { show: false },
      },// 第2个yAxis：成交量
      {
        scale: true,
        axisLabel: {
          show: false,
          formatter: '{value} %',
        },
      }// 第3个 yAxis：涨跌幅,防止原始y轴其他元素变形
    ],
    dataZoom: [
      { type: 'inside', start: 0, end: 100, xAxisIndex: [0, 1] },
      { type: 'slider', xAxisIndex: [0, 1], show: true, top: '93%', start: 0, end: 100 },
    ],
    series: [
      {
        name: '日K',
        type: 'candlestick',
        barWidth: '50%',
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
        barWidth: '60%',
        itemStyle: {
          color: function (params) {
            const idx = params.dataIndex;
            // 判断当前K线涨跌
            // console.log('收盘，', data.values[idx][1], '开盘，', data.values[idx][0]);
            return data.values[idx][1] >= data.values[idx][0]
              ? upColor   // 收>=开 红
              : downColor; // 收<开 绿
          }
        },
      },
      ...currentDateSeries,
      ...(buy.length > 0 && buy.some(point => point !== 0)
        ? [{
          name: '买点',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          symbol: 'rect',
          symbolSize: [15, 15],
          data: buy.map((point, idx) => {
            // console.log("idx：", idx);
            // console.log("data.date[idx]:", data.date[idx]);
            if (point !== 0) {
              return {
                value: [data.date[idx], point],
                symbolSize: 15,
              }
            }
            return null;
          }).filter(v => v !== null), // 过滤掉空值
          itemStyle: {
            color: '#0e0a03',
          },
          label: {
            show: true,
            position: 'inside',
            align: 'center',
            verticalAlign: 'middle',
            color: '#fff',
            fontSize: 11,
            formatter: 'B'
          },
        }]
        : [])
    ],
  });
  // 点击股票代码跳转到新页面
  chart.on('click', function (params) {
    if (params.componentType === 'title') {
      showDetail(stock);
    }
  });
  charts.value[id] = chart;
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
  const val = parseInt(gotoInput)
  if (val >= 1 && val <= totalPage.value) {
    currentPage.value = val
    fetchData();
  } else {
    alert('页码无效')
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  // redictToNewDay();
  fetchData();
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// 更新策略类型
const handleStrategy = (key, keyPath) => {
  // console.log(key, keyPath)
  strategyIndex.value = key;
  replayIndex.value = '0';
  stockCode.value = '';
  // selectedDate.value = '';
  redictToNewDay();
  currentPage.value = 1;
  fetchData();
}
// 更新技术指标
const handleReplay = (key, keyPath) => {
  // console.log(key, keyPath)
  replayIndex.value = key;
  strategyIndex.value = '0';
  stockCode.value = '';
  selectedDate.value = '2025-03-31';
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
function redictToNewDay() {
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  // 下午4点前显示昨天
  if (currentHour < 16) {
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    selectedDate.value = formatDate(yesterday);
  } else {
    // 之后今天
    selectedDate.value = formatDate(currentDate);
  }
}
function fetchData() {
  /* 传参 */
  const params = new URLSearchParams();
  // console.log("股票代码：", stockCode.value, "类型", typeof (stockCode.value));
  // console.log("replayindex：", replayIndex.value, "类型", typeof (replayIndex.value), "strategyIndex:", strategyIndex.value);
  // 技术指标
  if (replayIndex.value === "1" || replayIndex.value === "2" || replayIndex.value === "3") {
    console.log("涨停跌");
    params.append('pageNum', currentPage.value);
    if (selectedDate.value) {
      params.append('tradeDate', formatDate(selectedDate.value));
      // selectedDate.value = formatDate(selectedDate.value)
    } else {
      selectedDate.value = "2025-3-31";//TODO:要改标当前日期方法，后端改？传空值也可查询
    }
  }
  // 策略类型
  if (strategyIndex.value === "1") {
    params.append('page', currentPage.value);
    if (stockCode.value.trim() == "") {
      params.append('date', formatDate(selectedDate.value));
    }
    params.append('ts_code', stockCode.value);
    // console.log("url正确");
  }
  /* 接口 */
  // 技术指标
  const baseUrl = 'http://120.27.208.55:8080/api/'
  let url = baseUrl + 'stock/data'; // 默认全部
  if (replayIndex.value === '1') {
    url = baseUrl + 'stock/data'; // 全部
  }
  else if (replayIndex.value === '2') {
    url = baseUrl + 'stock/limit-up'; // 涨停
  }
  else if (replayIndex.value === '3') {
    url = baseUrl + 'stock/limit-down'; // 跌停
  }
  // 策略类型
  else if (strategyIndex.value === '1') {
    url = 'http://172.16.32.93:321/stock_bay'; //五日调整
  }

  fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
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
      const flattened = grid.map(itemList => {
        const name = itemList[0][0] // 股票代码
        // const startDate = new Date(itemList[0][1]); // 开始时间
        // const endDate = new Date(itemList[itemList.length - 1][1]); // 结束时间
        const kline = itemList.map(d => [
          d[1],  // 日期
          d[2],  // open
          d[3],  // high
          d[4],  // low
          d[5],  // close
          d[7],  // 涨跌幅
          d[8],  // 成交量
          d[9],  // 买点
        ])
        // console.log(kline[8]);
        return { name, data: kline }
      })
      stockData.value = flattened
      stockNumber.value = data.stock_count
    })
    .catch(error => {
      console.error('数据获取失败:', error);
    });
}

// 监听日期选择
watch(selectedDate, (newDate) => {
  if (newDate) {
    // console.log(selectedDate);
    stockCode.value = '';// 清空股票代码
    currentPage.value = 1; // 将当前页码重置为1
    fetchData();
  }
});

// 监听股票数据
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
        <h1>{{ selectedCondition }}{{ selectedStrategy }}（{{ stockNumber }}）</h1>
      </div>
      <div class="select-container">
        <div class="column">
          <span class="label">股票代码</span>
          <el-input v-model="stockCode" style="width: 150px" placeholder="输入股票代码" clearable
            @keyup.enter="onStockCodeInput" />
        </div>
        <div class="column">
          <span class="label">日期</span>
          <el-date-picker v-model="selectedDate" type="date" placeholder="选择日期" size="small" style="width: 150px" />
        </div>
        <div class=" column">
          <el-menu :default-active="replayIndex" mode="horizontal" class="strategy-menu" @select="handleReplay"
            :ellipsis="false">
            <el-sub-menu index="replay">
              <template #title>技术指标</template>
              <el-menu-item index="1">所有</el-menu-item>
              <el-menu-item index="2">每日涨停</el-menu-item>
              <el-menu-item index="3">每日跌停</el-menu-item>
              <el-menu-item index="4">半年线</el-menu-item>
              <el-menu-item index="5">年线</el-menu-item>
              <el-menu-item index="6">强于大盘</el-menu-item>
              <el-menu-item index="7">弱于大盘</el-menu-item>
              <el-menu-item index="8">大盘反向</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
        <div class="column">
          <el-menu :default-active="analysisIndex" mode="horizontal" class="strategy-menu" @select="handleAnalysis"
            :ellipsis="false">
            <el-sub-menu index="analysis">
              <template #title>大数据分析</template>
              <el-menu-item index="1">人气排名</el-menu-item>
              <el-menu-item index="2">热门板块</el-menu-item>
              <el-menu-item index="3">强势板块</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
        <div class="column">
          <el-menu :default-active="strategyIndex" mode="horizontal" class="strategy-menu" @select="handleStrategy"
            :ellipsis="false">
            <el-sub-menu index="strategy">
              <template #title>策略类型</template>
              <el-menu-item index="1">🟢 五日调整</el-menu-item>
              <el-menu-item index="2">🟡 打板策略</el-menu-item>
              <el-menu-item index="3">🟡 日内回转</el-menu-item>
              <el-menu-item index="4">🟡 波段交易</el-menu-item>
              <el-menu-item index="5">🔴 基本面选股</el-menu-item>
              <el-menu-item index="6">🔴 套利交易</el-menu-item>
              <el-menu-item index="7">🔴 专家跟随</el-menu-item>
              <el-menu-item index="8">🔴 财务估值</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
      </div>
    </div>

    <div class="grid-container">
      <div class="chart-wrapper" v-for="(stock, idx) in stockData" :key="stock.idx">
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
      <input type="number" v-model="gotoInput" style="width: 60px" placeholder="页码" />
      <button @click="gotoPage()">跳转</button>
    </div>
  </div>
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
