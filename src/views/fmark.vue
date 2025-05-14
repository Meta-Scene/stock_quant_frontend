<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as echarts from 'echarts'
import { upColor, upBorderColor, downColor, downBorderColor } from '@/stores/define'
import { MA } from '@/utils/MA';
import useStockStore from '@/stores/stockStore';
import { storeToRefs } from 'pinia';

//iframe
const showIframe = ref(false);
const iframeUrl = ref('');

const store = useStockStore();
store.init()
const {
  fmark_total,
  favorites
} = storeToRefs(store);
// console.log("fmark_total:", fmark_total.value);
// console.log("fmark_total:", fmark_total.value);
const toggleFavorite = (name) => store.toggleFavorite(name)
const isFavorited = (name) => store.isFavorited(name)

defineProps({ name: 'StockFmark' });
const route = useRoute();
const router = useRouter();
const ts_code = route.query.stockCode;
// console.log(`股票代码: ${ts_code}`);
// const current_page = ref(find_current_code() + 1);
// const total_page = ref(fmark_total.value.length);
const current_page = ref(1); // 初始是第一页，先别用 find_current_code
const total_page = ref(0);

onMounted(async () => {
  await store.loadFmarkTotal();  // 直接等它加载完 fmark_total
  if (fmark_total.value.length > 0) {
    //111
    total_page.value = fmark_total.value.length;
    current_page.value = find_current_code() + 1;
    await fetchDetail();
  } else {
    console.warn('fmark_total为空，无法定位股票');
  }
})

function fetchDetail() {
  const params = new URLSearchParams();
  let code;
  // console.log("是否有：", fmark_total);

  if (fmark_total) {
    code = fmark_total.value[current_page.value - 1]
  }
  else {
    code = ts_code;
  }
  params.append('ts_code', code);
  // console.log("fmark_total.value", fmark_total.value);
  // console.log("current_page", current_page.value);
  // console.log("检查：",fmark_total.value[current_page-1]);

  // const url = 'http://172.16.32.93:10015/stock_fmark'
  const url = 'http://120.27.208.55:10002/api/stock_single_data'
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
      const flattened = grid.map(itemList => {
        const name = itemList[0][0] // 股票代码
        const true_name = itemList[0][12];//股票名称
        // const true_name = itemList[0][13];//股票名称
        // console.log("true_name", true_name);

        const kline = itemList.map(d => [
          d[1],  // 日期
          d[2],  // open
          d[3],  // high
          d[4],  // low
          d[5],  // close
          d[6],  // 涨跌幅
          d[7],  // 成交量
          d[8],  // 买点
          d[9], // fmark
          d[12], // 股票名称
          // d[7],  // 涨跌幅
          // d[8],  // 成交量
          // d[9],  // 买点
          // d[10], // fmark
          // d[13], // 股票名称
        ])
        return { name, data: kline, true_name }
      })

      flattened.forEach((stock) => {
        // console.log("idx",idx);
        // console.log("stock",stock);
        initChart(stock)
      })
      // let sd = flattened;
      // initChart(sd)
    })
    .catch(error => {
      console.error('数据获取失败:', error);
    });
}

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
      rawData[i][7], // buy
      rawData[i][8], // fmark
      rawData[i][11], // 股票名称
    ])
  }
  return { date, values };
  /*
  values[i][0-3] 开盘 最高 最低 收盘
  values[i][4] 涨跌幅
  values[i][5] 成交量
  values[i][6] 买点
  values[i][7] 顶底分型
  values[i][10]名称
  */
}

function initChart(stock) {
  const chartContainer = document.getElementById('chart1');
  if (!chartContainer) return;
  const old = echarts.getInstanceByDom(chartContainer);
  if (old) {
    old.dispose();
  }
  const chart = echarts.init(chartContainer);
  const data = splitData(stock.data)
  const pctChg = data.values.map(v => v[4])
  const volumes = data.values.map(v => v[5])
  const buy = data.values.map(v => v[6])
  const fmark = data.values.map(v => v[7])
  // const name = data.values.map(v => v[10])
  const filteredFmark = fmark
    .map((value, index) => (value !== 0 ? [data.date[index], value] : null))
    .filter(v => v !== null);
  chart.setOption({
    title: { text: stock.true_name, left: '0', triggerEvent: true },
    // 交叉线
    tooltip: {
      trigger: 'axis', axisPointer: { type: 'cross' },
    },
    // 图例
    legend: { data: ['日K', 'MA5', 'MA10', 'MA120', 'MA250', 'Fmark'] },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    grid: [
      {
        left: '13%',
        right: '10%',
        top: 40,
        height: '60%',
        borderColor: '#ccc', // 加框线
        show: true,
      },  // 主图区域
      {
        left: '13%',
        right: '10%',
        top: '72%',
        // bottom: '15%',
        height: '15%',
        borderColor: '#ccc',
        show: true,
      }
    ],
    xAxis: [
      {
        data: data.date,
        boundaryGap: true,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
      },
      {
        type: 'category',
        gridIndex: 1,
        data: data.date,
        boundaryGap: true,
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
      { type: 'inside', start: 90, end: 100, xAxisIndex: [0, 1] },
      { type: 'slider', xAxisIndex: [0, 1], show: true, top: '88%', start: 90, end: 100 },
    ],
    series: [
      {
        name: '日K',
        type: 'candlestick',
        // z: 10,
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
        name: 'Fmark',
        type: 'line',
        data: filteredFmark,
        // data: fmark,
        smooth: false,
        lineStyle: {
          color: '#0000ff',
          width: 1.5
        },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: {
          color: '#0000ff',
        },
      },
      {
        name: 'MA5',
        type: 'line',
        data: MA(5, data),
        smooth: true,
        lineStyle: {
          color: '#e4b246',
          width: 1.5
        },
        symbol: 'circle',
        symbolSize: 3,
        itemStyle: {
          color: '#e4b246',
        },
      },
      {
        name: 'MA10',
        type: 'line',
        data: MA(10, data),
        smooth: true,
        lineStyle: {
          color: '#84bdeb',
          width: 1.5,
        },
        symbol: 'circle',
        symbolSize: 3,
        itemStyle: {
          color: '#84bdeb',
        },
      },
      {
        name: 'MA120',
        type: 'line',
        data: MA(120, data),
        smooth: true,
        lineStyle: {
          color: '#7fb797',
          width: 1.5,
        },
        symbol: 'circle',
        symbolSize: 3,
        itemStyle: {
          color: '#7fb797',
        },
      },
      {
        name: 'MA250',
        type: 'line',
        data: MA(250, data),
        smooth: true,
        lineStyle: {
          color: '#fa77ff',
          width: 1.5,
        },
        symbol: 'circle',
        symbolSize: 3,
        itemStyle: {
          color: '#fa77ff',
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
              ? upColor   // 收>开 红
              : downColor; // 收<开 绿
          }
        },
      },
      ...(buy.length > 0 && buy.some(point => point === 1)
        ? [{
          name: '买点',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          symbol: 'rect',
          z: 10,
          symbolSize: [15, 15],
          data: buy.map((point, idx) => {
            // console.log("idx：", idx);
            // console.log("data.date[idx]:", data.date[idx]);
            if (point === 1) {
              return {
                // value: [data.date[idx], parseFloat((point - 0.08).toFixed(2))],
                value: [data.date[idx], data.values[idx][2] - (0.02*data.values[idx][1])],
                symbolSize: 15,
              }
            }
            return null;
          }).filter(v => v !== null), // 过滤掉空值
          itemStyle: {
            color: '#b41331',
            // borderColor:'#b41331',
            // borderWidth:2,
            // borderRadius:5,
          },
          label: {
            show: true,
            position: 'inside',
            align: 'center',
            verticalAlign: 'middle',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight:'bold',
            formatter: 'B'
          },
        }]
        : []),
        ...(buy.length > 0 && buy.some(point => point === 2)
        ? [{
          name: '卖点',
          type: 'scatter',
          coordinateSystem: 'cartesian2d',
          symbol: 'rect',
          z: 10,
          symbolSize: [15, 15],
          data: buy.map((point, idx) => {
            // console.log("idx：", idx);
            // console.log("data.date[idx]:", data.date[idx]);
            if (point === 2) {
              return {
                value: [data.date[idx], data.values[idx][3]+(0.02*data.values[idx][1])],
                symbolSize: 15,
              }
            }
            return null;
          }).filter(v => v !== null), // 过滤掉空值
          itemStyle: {
            color: '#1656a7',
            // borderColor:'#1656a7',
            // borderWidth:2,
            // borderRadius:5,
          },
          label: {
            show: true,
            position: 'inside',
            align: 'center',
            verticalAlign: 'middle',
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight:'bold',
            formatter: 'S'
          },
        }]
        : []),
    ],
  });

  // 监听标题点击
  chart.on('click', params => {
    if (params.componentType === 'title') {
      // stock.name 示例："000700.SZ" 或 "000700.SH"
      const codeNoSuffix = stock.name.split('.')[0];
      iframeUrl.value = `https://wap.eastmoney.com/quote/stock/0.${codeNoSuffix}.html?appfenxiang=1`;
      showIframe.value = true;
    }
  });
}

function updateRouteWithCode() {
  const code = fmark_total.value[current_page.value - 1]
  router.replace({ query: { stockCode: code } })
}

function prevPage() {
  if (current_page.value > 1) {
    current_page.value--;
    updateRouteWithCode();
    fetchDetail();
  }
}

function nextPage() {
  if (current_page.value < total_page.value) {
    current_page.value++;
    updateRouteWithCode();
    fetchDetail();
  }
}

function find_current_code() {
  for (let i = 0; i < fmark_total.value.length; i++) {
    if (fmark_total.value[i] == ts_code) {
      return i;
    }
  }
}

</script>

<template>
  <div id="f">
    <!-- <svg class="fullscreen-btn icon" style="right: 91px" @click="toggleFavorite(ts_code)"
      :fill="isFavorited(ts_code) ? '#e91e63' : '#999'" viewBox="0 0 1024 1024" width="20" height="20">
      <path
        d="M480 480V160a32 32 0 1164 0v320h320a32 32 0 110 64H544v320a32 32 0 11-64 0V544H160a32 32 0 110-64h320z" />
    </svg> -->
    <svg class="fullscreen-btn icon" @click="toggleFavorite(fmark_total[current_page - 1])"
      :fill="isFavorited(fmark_total[current_page - 1]) ? '#e91e63' : '#999'" viewBox="0 0 1024 1024" width="30"
      height="30">
      <path
        d="M480 480V160a32 32 0 1164 0v320h320a32 32 0 110 64H544v320a32 32 0 11-64 0V544H160a32 32 0 110-64h320z" />
    </svg>
    <div class="chart-container">
      <div class="chart-wrapper">
        <div class="chart" id="chart1"></div>
      </div>
    </div>
    <button class="btn left" @click="prevPage()">&lt;</button>
    <button class="btn right" @click="nextPage()">&gt;</button>

    <!-- iframe 弹窗 -->
    <div v-if="showIframe" class="iframe-modal">
      <div class="iframe-content">
        <button class="close-btn" @click="showIframe = false">×</button>
        <iframe :src="iframeUrl" frameborder="0"></iframe>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* iframe */

/* 新增 iframe 弹窗样式 */
.iframe-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.iframe-content {
  position: relative;
  width: 90%;
  height: 90%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;

  display: flex;              /* ← 新增 */
  align-items: center;        /* ← 新增：垂直居中 */
  justify-content: center;    /* ← 新增：水平居中 */
}
.iframe-content iframe {
  border: none;
  width: 375px;   /* 常见手机视口宽度 */
  height: 667px;  /* 根据实际比例调整 */
}
.close-btn {
  position: absolute;
  top: 8px; right: 12px;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  z-index: 1;
}







.fullscreen-btn {
  position: absolute;
  top: 10px;
  right: 50px;
  /* padding: 4px 8px; */
  z-index: 10;
}

/* 图表 */
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  background-color: #f4f6f8;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #333;

}

#f {
  height: 98vh;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  height: 100%;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  font-size: 14px;
}

.chart-container,
.chart-wrapper,
.chart {
  box-sizing: border-box;
}

.chart {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

/* 分页按钮 */
.btn {
  position: absolute;
  /* top: calc(50% - 27px); */
  overflow: hidden;
  width: 54px;
  height: 54px;
  font-size: 32px;
  font-weight: lighter;
  color: #fffbfb;
  background: rgba(190, 188, 188, 0.35);
  border: 0;
  border-radius: 50% !important;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn {
  box-sizing: border-box;
  max-height: 100vh;
}

.btn:hover {
  background: rgba(212, 210, 210, 0.35);
}

.left {
  right: 30px;
  top: calc(50% - 110px);
}

.right {
  right: 30px;
  top: calc(50% - 40px);
}

.chart-wrapper .chart {
  height: 100% !important;
}
</style>
