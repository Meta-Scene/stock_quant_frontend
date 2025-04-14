<script>
import { useRoute } from 'vue-router';

export default {
  name: 'StockDetail',
  setup() {
    const route = useRoute();
    const ts_code = route.query.stockCode;
    // const startDate = route.query.startDate;
    // const endDate = route.query.endDate;
    console.log(`股票代码: ${ts_code}`);
  }
}

function initChart(stock) {
  const chartContainer = document.getElementById('chart');  // 直接使用一个固定的 id
  if (charts.value['chart']) {
    charts.value['chart'].dispose();
  }
  const data = splitData(stock.data)
  const chart = echarts.init(chartContainer);
  // 提取成交量和涨跌幅
  const pctChg = data.values.map(v => v[4])
  const volumes = data.values.map(v => v[5])
  const sv = formatDate(selectedDate.value);
  // const sv = selectedDate.value;
  // console.log(1111);
  // console.log(selectedDate.value);
  // 买点
  // qqqqqqqqqq
  const buy = data.values.map(v => v[6])
  // console.log("日期输出：", data.date);

  // console.log(data.date);
  // console.log(selectedDate);

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
        // itemStyle: {
        //   color: '#915764'
        // }
        itemStyle: {
          color: function (params) {
            const idx = params.dataIndex;
            // 判断当前K线是涨还是跌
            // console.log('收盘，', data.values[idx][1], '开盘，', data.values[idx][0]);

            return data.values[idx][1] >= data.values[idx][0]
              ? upColor   // 收盘价 > 开盘价 → 红色
              : downColor; // 收盘价 < 开盘价 → 绿色
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
  charts.value['chart'] = chart
}

</script>

<template>
  <div class="chart-container">
    <div class="chart-wrapper">
      <div class="chart" id="chart"></div>
      <button class="export-btn" @click="exportChart">导出</button>
    </div>
  </div>
</template>
