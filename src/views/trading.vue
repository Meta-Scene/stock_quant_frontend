<script setup>
import * as echarts from 'echarts'
import { onMounted, computed, watch, nextTick, onBeforeUnmount, ref } from 'vue'
import useStockStore from '@/stores/stockStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { formatDate, redictToNewDay } from '@/utils/dateUtils';
import { splitData } from '@/utils/splitData';
import { MA } from '@/utils/MA';
import { pageSize, upColor, upBorderColor, downColor, downBorderColor, strategies, conditions, analysis } from '@/stores/define'

const router = useRouter();
const store = useStockStore();
store.init()
const {
  stockNumber,
  stockData,
  charts,
  currentPage,
  selectedDate,
  strategyIndex,
  replayIndex,
  analysisIndex,
  stockSearch,
  fmark_total,
  favorites
} = storeToRefs(store);
const toggleFavorite = (name) => store.toggleFavorite(name)
const isFavorited = (name) => store.isFavorited(name)

const totalPage = computed(() => {
  return Math.ceil(stockNumber.value / pageSize)
})
const gotoInput = ref('');//页码跳转框

/* 点击股票代码跳转到对应顶/底分型数据显示 */
function showDetail(stock) {
  // console.log("stockCode: ", stock.name);
  if (strategyIndex.value != '0') {
    window.open(
      router.resolve({
        name: 'StockFmark',
        query: {
          stockCode: stock.name,
        },
      }).href, '_blank'
    );
  }
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
  // if (charts.value[id]) {
  //   charts.value[id].dispose();
  // }
  const el = document.getElementById(id)
  if (!el) {
    console.warn(`图表容器未找到: ${id}`);
    return;
  }
  // 检查并销毁已有实例
  const existingInstance = echarts.getInstanceByDom(el);
  if (existingInstance) {
    existingInstance.dispose();
  }

  const chart = echarts.init(el);
  const data = splitData(stock.data)
  // 提取涨跌幅,成交量,买点,半年线,年线,股票名称
  const pctChg = data.values.map(v => v[4]);
  const volumes = data.values.map(v => v[5]);
  const buy = data.values.map(v => v[6]);
  const halfYear = data.values.map(v => v[7]);
  const wholeYear = data.values.map(v => v[8]);
  // const sell = data.values.map(v => v[10]);//卖点
  //为显示当前日期黄色标记点，格式化日期
  const sv = formatDate(selectedDate.value);
  // 当前日期高亮显示
  const currentDateSeries = stockSearch.value.trim() === '' ? [{
    // const currentDateSeries = stockName === '' ? [{
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
  //选择半年线才显示
  const halfYearLineShow = replayIndex.value === '4' ? [{
    name: 'MA120',
    type: 'line',
    data: halfYear,
    smooth: true,
    lineStyle: {
      color: '#ff77ff',
      width: 1.5,
    },
    symbol: 'circle',
    symbolSize: 3,
    itemStyle: {
      color: '#ff77ff',
    },
  },
  ] : [];
  //选择年线才显示
  const wholeYearLineShow = replayIndex.value === '5' ? [{
    name: 'MA250',
    type: 'line',
    data: wholeYear,
    smooth: true,
    lineStyle: {
      color: '#581845',
      width: 1.5,
    },
    symbol: 'circle',
    symbolSize: 3,
    itemStyle: {
      color: '#581845',
    },
  },
  ] : [];
  //test
  // console.log("stock.name是:", stock.name, "stockName是:", stockName);
  chart.setOption({
    // title: { text: stock.name, left: '0', triggerEvent: true },
    title: { text: stock.true_name, left: '0', triggerEvent: true },//改为显示股票名称
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
        symbolSize: 3,
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
        symbolSize: 3,
        itemStyle: {
          color: '#4682b4',
        },
      },
      ...halfYearLineShow,
      ...wholeYearLineShow,
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
                value: [data.date[idx], data.values[idx][2] - 0.3],
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
        : []),
      //卖点
      // ...(sell.length > 0 && sell.some(point => point !== 0)
      //   ? [{
      //     name: '卖点',
      //     type: 'scatter',
      //     coordinateSystem: 'cartesian2d',
      //     symbol: 'rect',
      //     z: 10,
      //     symbolSize: [15, 15],
      //     data: sell.map((point, idx) => {
      //       // console.log("idx：", idx);
      //       // console.log("data.date[idx]:", data.date[idx]);
      //       if (point !== 0) {
      //         return {
      //           value: [data.date[idx], point],
      //           symbolSize: 15,
      //         }
      //       }
      //       return null;
      //     }).filter(v => v !== null), // 过滤掉空值
      //     itemStyle: {
      //       // color: '##0e0a03',
      //       color: '#e74c3c',
      //       borderColor: '#c0392b',
      //       borderWidth: 1.5,
      //     },
      //     label: {
      //       // show: true,
      //       // position: 'inside',
      //       // align: 'center',
      //       // verticalAlign: 'middle',
      //       // color: '#fff',
      //       // fontSize: 11,
      //       // formatter: 'S'
      //       show: true,
      //       color: '#ffffff',
      //       fontSize: 11,
      //       fontWeight: 11,
      //       position: 'inside',
      //       formatter: 'S'
      //     },
      //   }]
      //   : []),
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

async function copyChartToClipboard(idx) {
  const chart = charts.value[`chart${idx}`]
  if (!chart) return

  const dataUrl = chart.getDataURL({ pixelRatio: 2, backgroundColor: '#fff' })

  try {
    const blob = await (await fetch(dataUrl)).blob()
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ])
    showToast('复制成功')
  } catch (err) {
    console.error('复制失败:', err)
    alert('复制失败，当前操作系统不支持图像剪贴板写入')
  }
}

const isFullscreen = ref(false);
function showToast(message) {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.style.position = 'fixed'
  toast.style.top = '50%'
  toast.style.left = '50%'
  toast.style.transform = 'translate(-50%, -50%)'
  toast.style.padding = '10px 16px'
  toast.style.background = 'rgba(0, 0, 0, 0.75)'
  toast.style.color = '#fff'
  toast.style.fontSize = '14px'
  toast.style.borderRadius = '6px'
  toast.style.zIndex = '9999'
  toast.style.opacity = '0'
  toast.style.transition = 'opacity 0.3s ease'

  document.body.appendChild(toast)

  requestAnimationFrame(() => {
    toast.style.opacity = '1'
  })

  setTimeout(() => {
    toast.style.opacity = '0'
    setTimeout(() => {
      document.body.removeChild(toast)
    }, 300)
  }, 1500)
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  document.querySelectorAll('.chart-wrapper').forEach((wrapper) => {
    // const btn = wrapper.querySelector('.fullscreen-btn')
    const chartDiv = wrapper.querySelector('.chart')
    const chart = charts.value[chartDiv.id];
    if (!isFullscreen.value) {
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
    // if (btn) btn.textContent = isFullscreen ? '×' : '全屏'
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
  const val = parseInt(gotoInput.value)
  if (val >= 1 && val <= totalPage.value) {
    currentPage.value = val
    fetchData();
  } else {
    alert('页码无效')
  }
}

onMounted(async () => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  selectedDate.value = redictToNewDay();
  await store.loadFmarkTotal(); // <<< 加上这句，从IDB加载 fmark_total
  // fetchData();
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// 更新策略类型
const handleStrategy = (key, keyPath) => {
  // console.log(key, keyPath)
  strategyIndex.value = key;
  replayIndex.value = '0';
  analysisIndex.value = '0';
  stockSearch.value = '';
  // stockName = '';
  // selectedDate.value = '';
  // selectedDate.value = redictToNewDay();
  currentPage.value = 1;
  fetchData();
}
// 更新技术指标
const handleReplay = (key, keyPath) => {
  // console.log(key, keyPath)
  replayIndex.value = key;
  strategyIndex.value = '0';
  analysisIndex.value = '0';
  stockSearch.value = '';
  // selectedDate.value = redictToNewDay();
  currentPage.value = 1;
  fetchData();
}
// 更新大数据分析
const handleAnalysis = (key, keyPath) => {
  // console.log(key, keyPath)
  analysisIndex.value = key;
  replayIndex.value = '0';
  strategyIndex.value = '0';
  currentPage.value = 1;
  fetchData();
}

function fetchData() {
  /* 传参 */
  const params = new URLSearchParams();
  // console.log("股票代码：", stockCode.value, "类型", typeof (stockCode.value));
  // console.log("replayindex：", replayIndex.value, "类型", typeof (replayIndex.value), "strategyIndex:", strategyIndex.value);
  // 技术指标
  if (replayIndex.value === "1" || replayIndex.value === "2" || replayIndex.value === "3" || replayIndex.value === "4" || replayIndex.value === "5" || replayIndex.value === "6" || replayIndex.value === "7") {
    console.log("技术指标");
    params.append('page', currentPage.value);
    params.append('trade_date', formatDate(selectedDate.value));
    // params.append('replay_index', replayIndex.value);
  }
  // 策略类型
  if (strategyIndex.value === "1" || strategyIndex.value === "2" || strategyIndex.value === "3" || strategyIndex.value === "4" || strategyIndex.value === "5") {
    params.append('page', currentPage.value);
    if (stockSearch.value.trim() == "") {
      // if (stockName == '') {
      params.append('trade_date', formatDate(selectedDate.value));
    }
    params.append('ts_code', stockSearch.value);
    // console.log("url正确");
  }

  /* 接口 */
  // 技术指标
  let url = `http://120.27.208.55:10003/api/stock_data/${replayIndex.value}`
  // 策略类型
  if (strategyIndex.value !== '0') {
    // url = 'http://120.27.208.55:10015/stock_bay'; //五日调整
    url = `http://120.27.208.55:10003/api/stock_analysis/${strategyIndex.value}`;
    // url = 'http://172.16.32.93:10015/stock_bay';
  }
  // else if (strategyIndex.value === '2') {
  //   // url = 'http://120.27.208.55:10015/macd'; //MACD金叉
  //   // url = 'http://172.16.33.222:10015/macd';
  // }
  // else if (strategyIndex.value === '3') {
  //   // url = 'http://120.27.208.55:10015/kdj'; //KDJ金叉
  //   // url = 'http://172.16.32.93:10015/kdj';
  // }
  // else if (strategyIndex.value === '4') {
  //   // url = 'http://120.27.208.55:10015/low_in'; //低位资金净流入
  //   // url = 'http://172.16.32.93:10015/low_in';
  // }
  // else if (strategyIndex.value === '5') {
  //   // url = 'http://120.27.208.55:10015/high_out'; //高位资金净流出
  //   // url = 'http://172.16.32.93:10015/high_out';
  // }

  fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-cache', // 禁用缓存
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('网络响应失败');
      }
      return response.json();
    })
    .then(async data => {
      console.log('成功:', data);
      const grid = data.grid_data || [];

      //grid.length
      if (data.stock_count === 0) {
        currentPage.value = 0;
      }
      const flattened = grid.map(itemList => {
        const name = itemList[0][0] // 股票代码
        const true_name = itemList[0][11];//股票名称
        // const true_name = itemList[0][12];//股票名称
        // console.log("truename", true_name);
        const kline = itemList.map(d => [
          d[1],  // 日期
          d[2],  // open
          d[3],  // high
          d[4],  // low
          d[5],  // close
          d[6],  // 涨跌幅
          d[7],  // 成交量
          d[8],  // 买点
          d[9], // 半年线
          d[10], // 年线
          d[11], // 股票名称
          // d[7],  // 涨跌幅
          // d[8],  // 成交量
          // d[9],  // 买点
          // d[10], // 半年线
          // d[11], // 年线
          // d[12], // 股票名称
          // d[12], // 卖点
        ])
        // console.log("11111111111111111111111", kline[11]);
        return { name, data: kline, true_name }
      })
      stockData.value = flattened
      stockNumber.value = data.stock_count
      // 把全部的股票代码拿到
      if (data.ts_codes) {
        fmark_total.value = data.ts_codes;
        await store.saveFmarkTotal();  // <<< 保存到 IndexedDB
        // 在 fetchData 成功后，确保数据同步到本地存储
        // localStorage.setItem('fmark_total', JSON.stringify(fmark_total.value));
        console.log("first get fmark_total:", fmark_total.value);

      }
    })
    .catch(error => {
      console.error('数据获取失败:', error);
    });
  console.log("赋值后 fmark_total:", fmark_total.value);
}

// 监听日期选择
watch(selectedDate, (newDate) => {
  if (newDate) {
    // console.log(selectedDate);
    stockSearch.value = '';// 清空股票查询框
    // stockName = '';
    currentPage.value = 1; // 将当前页码重置为1
    fetchData();
  }
});

// 监听股票数据
watch(stockData, () => {
  nextTick(() => {
    setTimeout(() => {
      stockData.value.forEach((stock, idx) => {
        const id = `chart${idx}`
        initChart(id, stock)
      })
    }, 0)
  })
}, { immediate: true })
</script>

<template>
  <div id="app">
    <div class="top-bar">
      <div class="title-container">
        <h1>{{ selectedCondition }}{{ selectedStrategy }}{{ selectedAnalysis }} （{{ stockNumber }}）</h1>
      </div>
      <div class="select-container">
        <div class="column">
          <span class="label">股票查询</span>
          <el-input v-model="stockSearch" style="width: 150px" placeholder="输入名称/代码" clearable
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
              <el-menu-item index="4">自选股</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
        <div class="column">
          <el-menu :default-active="strategyIndex" mode="horizontal" class="strategy-menu" @select="handleStrategy"
            :ellipsis="false">
            <el-sub-menu index="strategy">
              <template #title>策略类型</template>
              <el-menu-item index="1">🟢 五日调整</el-menu-item>
              <el-menu-item index="2">🟢 MACD金叉</el-menu-item>
              <el-menu-item index="3">🟢 KDJ金叉</el-menu-item>
              <el-menu-item index="4">🟢 低位资金净流入</el-menu-item>
              <el-menu-item index="5">🟢 高位资金净流出</el-menu-item>
              <el-menu-item index="6">🟡 打板策略</el-menu-item>
              <el-menu-item index="7">🟡 日内回转</el-menu-item>
              <el-menu-item index="8">🟡 波段交易</el-menu-item>
              <el-menu-item index="9">🔴 基本面选股</el-menu-item>
              <el-menu-item index="10">🔴 套利交易</el-menu-item>
              <el-menu-item index="11">🔴 专家跟随</el-menu-item>
              <el-menu-item index="12">🔴 财务估值</el-menu-item>
            </el-sub-menu>
          </el-menu>
        </div>
      </div>
    </div>

    <div class="grid-container">
      <div class="chart-wrapper" v-for="(stock, idx) in stockData" :key="stock.name">
        <div class="chart" :id="`chart${idx}`"></div>
        <svg style="right: 63px" @click="fullscreen(idx)" t="1745546707332" class="icon fullscreen-btn"
          v-if="!isFullscreen" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1018"
          width="20" height="20">
          <path
            d="M936.7 342.6c-12.8 0-23.2-10.4-23.2-23.2V113.6c0-1.8-1.5-3.3-3.3-3.3H704.4c-12.8 0-23.2-10.4-23.2-23.2s10.4-23.2 23.2-23.2h205.7c27.4 0 49.8 22.3 49.8 49.8v205.7c0 12.8-10.4 23.2-23.2 23.2zM87.3 342.6c-12.8 0-23.2-10.4-23.2-23.2V113.6c0-27.4 22.3-49.8 49.8-49.8h202.7c12.8 0 23.2 10.4 23.2 23.2s-10.4 23.2-23.2 23.2H113.8c-1.8 0-3.3 1.5-3.3 3.3v205.7c0 13-10.4 23.4-23.2 23.4zM316.6 959.7H113.8c-27.4 0-49.8-22.3-49.8-49.8V704.2c0-12.8 10.4-23.2 23.2-23.2s23.2 10.4 23.2 23.2V910c0 1.8 1.5 3.3 3.3 3.3h202.7c12.8 0 23.2 10.4 23.2 23.2s-10.2 23.2-23 23.2zM910.2 959.7H704.4c-12.8 0-23.2-10.4-23.2-23.2s10.4-23.2 23.2-23.2h205.7c1.8 0 3.3-1.5 3.3-3.3V704.2c0-12.8 10.4-23.2 23.2-23.2s23.2 10.4 23.2 23.2V910c0.1 27.4-22.2 49.7-49.6 49.7z"
            fill="currentColor" p-id="1019"></path>
          <path
            d="M408.1 431.1c-5.9 0-11.9-2.3-16.4-6.8L90.8 123.4c-9.1-9.1-9.1-23.8 0-32.8 9.1-9.1 23.8-9.1 32.8 0l300.9 300.9c9.1 9.1 9.1 23.8 0 32.8-4.5 4.6-10.5 6.8-16.4 6.8zM916.8 939.8c-5.9 0-11.9-2.3-16.4-6.8L615 647.7c-9.1-9.1-9.1-23.8 0-32.8 9.1-9.1 23.8-9.1 32.8 0l285.3 285.3c9.1 9.1 9.1 23.8 0 32.8-4.4 4.6-10.4 6.8-16.3 6.8zM107.2 939.8c-5.9 0-11.9-2.3-16.4-6.8-9.1-9.1-9.1-23.8 0-32.8l300.9-300.9c9.1-9.1 23.8-9.1 32.8 0 9.1 9.1 9.1 23.8 0 32.8L123.6 933c-4.5 4.6-10.5 6.8-16.4 6.8zM615.9 431.1c-5.9 0-11.9-2.3-16.4-6.8-9.1-9.1-9.1-23.8 0-32.8L900.4 90.6c9.1-9.1 23.8-9.1 32.8 0 9.1 9.1 9.1 23.8 0 32.8L632.3 424.3c-4.5 4.6-10.5 6.8-16.4 6.8z"
            fill="currentColor" p-id="1020"></path>
        </svg>
        <svg style="right: 63px" @click="fullscreen(idx)" t="1745550097760" class="icon fullscreen-btn" v-else
          viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="916" width="20" height="20">
          <path
            d="M128 128h256v64H192v192H128V128zM896 640v256h-256v-64h192v-192h64zM384 686.496L174.496 896 128 849.504 337.504 640H192v-64h256v256h-64v-145.504zM849.504 128L640 337.504V192h-64v256h256v-64h-145.504L896 174.496 849.504 128z"
            fill="#8e8e8e" p-id="917"></path>
        </svg>
        <svg t="1745547690226" stroke="currentColor" fill="currentColor" class="fullscreen-btn icon" style="right: 35px"
          @click="exportChart(idx, stock.name)" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="1800" width="20" height="20">
          <path
            d="M894.464 966.144H119.296c-22.528 0-40.96-18.432-40.96-40.96V365.056c0-22.528 18.432-40.96 40.96-40.96h206.848v61.44H139.776v518.656h734.208V385.536h-199.68v-61.44h220.16c22.528 0 40.96 18.432 40.96 40.96v559.616c0 23.04-18.432 41.472-40.96 41.472z"
            fill="currentColor" p-id="1801"></path>
          <path d="M326.144 354.816m-30.72 0a30.72 30.72 0 1 0 61.44 0 30.72 30.72 0 1 0-61.44 0Z" fill="currentColor"
            p-id="1802"></path>
          <path d="M328.704 250.88m-30.72 0a30.72 30.72 0 1 0 61.44 0 30.72 30.72 0 1 0-61.44 0Z" fill="currentColor"
            p-id="1803"></path>
          <path d="M687.616 252.416m-30.72 0a30.72 30.72 0 1 0 61.44 0 30.72 30.72 0 1 0-61.44 0Z" fill="currentColor"
            p-id="1804"></path>
          <path d="M507.392 81.92m-30.72 0a30.72 30.72 0 1 0 61.44 0 30.72 30.72 0 1 0-61.44 0Z" fill="currentColor"
            p-id="1805">
          </path>
          <path d="M674.304 354.816m-30.72 0a30.72 30.72 0 1 0 61.44 0 30.72 30.72 0 1 0-61.44 0Z" fill="currentColor"
            p-id="1806"></path>
          <path
            d="M510.464 710.144h-5.12c-15.36 0-28.16-12.8-28.16-28.16V145.92c0-15.36 12.8-28.16 28.16-28.16h5.12c15.36 0 28.16 12.8 28.16 28.16v536.064c0 15.36-12.8 28.16-28.16 28.16z"
            p-id="1807"></path>
          <path d="M309.28896 227.31264l177.4336-167.8336 42.21952 44.63616-177.42848 167.8336z" fill="currentColor"
            p-id="1808">
          </path>
          <path d="M486.13376 104.22272l42.21952-44.63616 177.42848 167.8336-42.21952 44.63104z" fill="currentColor"
            p-id="1809">
          </path>
        </svg>
        <svg t="1745547894503" stroke="currentColor" fill="currentColor" @click="copyChartToClipboard(idx)"
          class=" fullscreen-btn icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
          p-id="2049" width="20" height="20">
          <path
            d="M639.9 256.3H192.4c-35.2 0-63.9 28.8-63.9 63.9v575.4c0 35.2 28.8 63.9 63.9 63.9h447.5c35.2 0 63.9-28.8 63.9-63.9V320.2c0-35.1-28.8-63.9-63.9-63.9z m0 639.3H192.4V320.2h447.5v575.4z"
            p-id="2050"></path>
          <path
            d="M831.6 64.5H384.1c-35.2 0-63.9 28.8-63.9 63.9v63.9h63.9v-63.9h447.5v575.4h-63.9v63.9h63.9c35.2 0 63.9-28.8 63.9-63.9V128.4c0.1-35.1-28.7-63.9-63.9-63.9z"
            p-id="2051"></path>
        </svg>
        <svg class="fullscreen-btn icon" style="right: 91px" @click="toggleFavorite(stock.name)"
          :fill="isFavorited(stock.name) ? '#e91e63' : '#999'" viewBox="0 0 1024 1024" width="20" height="20">
          <path
            d="M480 480V160a32 32 0 1164 0v320h320a32 32 0 110 64H544v320a32 32 0 11-64 0V544H160a32 32 0 110-64h320z" />
        </svg>
        <!-- <button class="fullscreen-btn" @click="fullscreen(idx)">全屏</button> -->
        <!-- <button class="fullscreen-btn" style="right: 80px" @click="exportChart(idx, stock.name)">导出</button> -->
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
  top: 6px;
  right: 7px;
  padding: 4px 8px;
  /* background-color: #2c3e50; */
  color: #8e8e8e;
  /* border: none; */
  cursor: pointer;
  /* size: 10px; */
  /* font-size: 3px; */
  /* border-radius: 4px; */
  z-index: 10;
}

.fullscreen-btn:hover {
  /* background-color: #34495e; */
  color: #000000;
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
