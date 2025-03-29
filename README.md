# 量化可视化前端

## 介绍

该快照平台用于以图表形式展示某个时间段内多支股票的行情、均线、买卖点等关键数据，支持图表分页、导出、放大等操作。

## 具体功能：

- 每页展示 **3 × 3（共 9 个）图表**，包括开盘（open）、最高（high）、最低（low）、收盘（close）、涨跌幅（pct_chg）、成交量（vol）、MA均线;
- 可选择日期查看数据;
- 可下拉菜单选择不同策略查看数据;
- 有多页切换功能;
- 有买卖点标记功能;
- 单个图表快速导出图片功能;
- 单图表全屏放大功能;

## Getting Started

### Create

```
vite+vue3+pinia
npm 10.9.2
node v22.14.0
```

```
npm create vue@latest

npm install element-plus --save

npm install echarts --save
```

### Clone & Install

```
git clone https://github.com/Meta-Scene/stock_quant_frontend.git
cd stock_quant_frontend
npm i
npm run dev
```

- 日k线顺序修改✔
- 加买点搜索框✔
- 删涨跌幅✔
- 日期传参失败✔
- 买卖点 （等后端接口）
- 买点查询搜索 （等后端接口）
- 图标✔
- 选中的日期在图表中标注✔
- MA小数点后两位✔
- 策略类型新增五日调整✔
- 日k名称修改 ！硬编码无法直接修改
- 涨跌幅数值显示✔
- 新增大数据分析板块✔
