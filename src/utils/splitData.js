/* 提取k线图数据,传入某支股票的grid_data */
export function splitData(rawData) {
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
      rawData[i][8], // MA120
      rawData[i][9], // MA250
      rawData[i][10], // 股票名称
      // rawData[i][11], // 卖点
    ])
  }
  return { date, values };
  /*
  values[i][0-3] 开盘 最高 最低 收盘
  values[i][4] 涨跌幅
  values[i][5] 成交量
  values[i][6] 买点
  values[i][7] 半年线
  values[i][8] 年线
  values[i][9] 股票名称
  */
}
