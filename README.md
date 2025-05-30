# 量化可视化前端

## 简介

该快照平台用于以图表形式展示某个时间段内多支股票的行情、均线、买卖点等关键数据，支持图表分页、导出、放大等操作。

## 具体功能

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

## TODO20250329

- 日k线顺序修改✔
- 加买点搜索框✔
- 删涨跌幅✔
- 日期传参失败✔
- 买卖点 买点已加，卖点暂无数据✔
- 买点查询搜索 （等后端接口）✔
- 全部（等后端java接口）✔
- 图标✔
- 选中的日期在图表中标注✔
- MA小数点后两位✔
- 策略类型新增五日调整✔
- 日k名称修改 ！硬编码无法直接修改
- 涨跌幅数值显示✔
- 新增大数据分析板块✔
- 绿：上线；黄：建设中；红：未开始✔
- 修改左上角文本显示✔
- 图表样式修改✔

### nginx本地配置

再说吧再说吧

### 服务器（aliyun）前端部署 ☝️🤓

http://120.27.208.55:10000

#### 上传

本地打包dist上传至服务器该目录下：
`/home/html/`，我的命名是stock_quant_frontend

#### 修改配置文件

进入nginx配置目录：`cd /usr/local/nginx/conf/`

打开配置文件：`nano nginx.conf`

```
server {
        listen       10000;
        server_name  localhost;

        location / {
                root        /home/html/stock_quant_frontend/;
                try_files   $uri $uri/ /index.html;
                index       index.html;
        }
}
```

#### 重启nginx服务

`cd /usr/sbin`

`./nginx -s stop`

`./nginx`

## TODO&新增功能20250417

在策略类型菜单下的五日调整页面，点击图表中的股票代码跳转至该股票的顶底分型分析图（单表单页）

需求：要保存前一页状态（九张图）

TODO:

- 原先查询页面的数据缓存（没做哈哈，windows.open新开一个页面）
- 加入pinia保存全局变量✔
- 工具组件提取单独文件✔
- 初始时间为最新时间✔
- 只有点击股票代码才跳转页面✔
- 新页面的图表✔
- 股票名称改成股票代码（buy和fmark）✔
- 点击股票名称跳转，发给后端仍是股票代码✔
- 日期显示最新数据（逻辑要调整）✔
- 数据格式要调整✔
- Java部分接口更改要更新？小写大写✔

```
{
    "column_names": ["ts_code", "trade_date", "open", "high", "low", "close", "pre_close", "pct_chg", "vol", "bay","ma5","ma10","ma120","ma250","stockName"],
    "date": "2024-01-12",
    "grid_data": [
        [
            ["839680.BJ","2024-10-21",26.88,35.98,25.81,34.68,27.9,24.3,170356.99, 0.0, 1],
            ["839680.BJ","2024-10-22",33.0,33.0,26.0,26.31,34.68,-24.13,140662.5,0.0,2],
            ["839680.BJ","2024-10-23",25.9,27.6,24.2,26.4,26.31,0.34,86014.5,0.0,3],
        ],
    ],

}
```

取色网站：https://htmlcolorcodes.com/

顶底分析页面增加上下页切换功能
传日期，股票代码

返回的数据格式

```
{
  "columns": [
    "ts_code",
    "trade_date",
    "open",
    "high",
    "low",
    "close",
    "pre_close",
    "pct_chg",
    "vol",
    "bay",
    "Fmark",
    "ma120",
    "ma250",
    "name"
  ],
  "data": [
    [
      [
        "000998.SZ",
        "2024-01-02",
        14.1, 14.25, 14.01, 14.15, 14.1, 0.35, 120311.61, 0, 0, null, null, "隆平高科"
      ],
      [
        "000998.SZ",
        "2024-01-03",
        14.1, 14.13, 13.78, 13.9, 14.15, -1.77, 140087.91, 0, 0, null, null, "隆平高科"
      ],
      [
        "000998.SZ",
        "2024-01-04",
        13.9, 13.99, 13.55, 13.73, 13.9, -1.22, 132742.21, 0, 0, null, null, "隆平高科"
      ],
    ]
  ],
  "total_stock":["000001.SZ","000002.SZ","000123.SZ","000998.SZ",000012.SZ","000013.SZ","000222.SZ"],
}
```
## TODO20250425
- 深色模式
- 自选股接口
- tooltips重写
- 接口文档


跨域 iframe 无法直接操作 contentWindow.history，在 Vue 中维护一份 URL 历史