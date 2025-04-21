<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import * as echarts from 'echarts'
import { upColor, upBorderColor, downColor, downBorderColor } from '@/stores/define'
import { MA } from '@/utils/MA';

defineProps({ name: 'StockFmark' });
const route = useRoute();
const ts_code = route.query.stockCode;
// console.log(`股票代码: ${ts_code}`);

onMounted(() => {
  fetchDetail();
})

function fetchDetail() {
  const params = new URLSearchParams();
  params.append('ts_code', ts_code);
  const url = 'http://120.27.208.55:10015/stock_fmark'
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
      const grid = data.data || [];
      const flattened = grid.map(itemList => {
        const name = itemList[0][0] // 股票代码
        const true_name = itemList[0][11];//股票名称
        console.log("true_name", true_name);

        const kline = itemList.map(d => [
          d[1],  // 日期
          d[2],  // open
          d[3],  // high
          d[4],  // low
          d[5],  // close
          d[7],  // 涨跌幅
          d[8],  // 成交量
          d[9],  // 买点
          d[10], // fmark
          d[11], // 股票名称
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
      rawData[i][9], // 股票名称
    ])
  }
  return { date, values };
  /*
  values[i][0-3] 开盘 最高 最低 收盘
  values[i][4] 涨跌幅
  values[i][5] 成交量
  values[i][6] 买点
  values[i][7] 顶底分型

  */
}

function initChart(stock) {
  const chartContainer = document.getElementById('chart1');
  const data = splitData(stock.data)
  const chart = echarts.init(chartContainer);
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
        name: 'MA120',
        type: 'line',
        data: MA(120, data),
        smooth: true,
        lineStyle: {
          color: '#ff77ff',
          width: 1.5,
        },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: {
          color: '#ff77ff',
        },
      },
      {
        name: 'MA250',
        type: 'line',
        data: MA(250, data),
        smooth: true,
        lineStyle: {
          color: '#581845',
          width: 1.5,
        },
        symbol: 'circle',
        symbolSize: 5,
        itemStyle: {
          color: '#581845',
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
}
</script>

<template>
  <div class="chart-container">
    <div class="chart-wrapper">
      <div class="chart" id="chart1"></div>
      <button class="export-btn" @click="exportChart">导出</button>
    </div>
  </div>
</template>

<style scoped>
/* 图表 */
#app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.chart {
  width: 100%;
  height: 100%;
  border-radius: 8px;

}

.chart-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 9999;
  background-color: #fff;
}

.chart-wrapper .chart {
  height: 100vh !important;
}

.chart-wrapper {
  font-size: 14px;
  padding: 6px 10px;
}
</style>
