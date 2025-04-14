// 计算均线
export function MA(cnt, data) {
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
