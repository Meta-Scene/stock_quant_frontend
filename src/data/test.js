// let data = {
//   "column_names": ["ts_code", "trade_date", "open", "high", "low", "close", "pre_close", "pct_chg", "vol", "bay","point"],
//   "date": "2024-01-12",
//   "grid_data": [
//       [
//           ["839680.BJ","2024-10-21",26.88,35.98,25.81,34.68,27.9,24.3,170356.99, 0.0, 1],
//           ["839680.BJ","2024-10-22",33.0,33.0,26.0,26.31,34.68,-24.13,140662.5,0.0,2],
//           ["839680.BJ","2024-10-23",25.9,27.6,24.2,26.4,26.31,0.34,86014.5,0.0,3],
//       ],
//   ],
// }
// console.log("data",data);

//       const grid = data.grid_data || [];
//       console.log("grid",grid);

//       // if (grid.length === 0) {
//       //   currentPage.value = 0;
//       // }
//       // const flattened = grid.flat().map(itemList => {
//       const flattened = grid.map(itemList => {
//         const name = itemList[0][0] // 股票代码
//         console.log("name",name);
//         // const startDate = new Date(itemList[0][1]); // 开始时间
//         // const endDate = new Date(itemList[itemList.length - 1][1]); // 结束时间

//         const kline = itemList.map(d => [
//           d[1],  // 日期
//           d[2],  // open
//           d[3],  // high
//           d[4],  // low
//           d[5],  // close
//           d[7],  // 涨跌幅
//           d[8],  // 成交量
//           d[9],  // 买点
//         ])

//         console.log("kline:",kline);
//         return { name, data: kline }
//       })
//       console.log("flattened",flattened);

//       stockData.value = flattened
