<script>
import { useRoute } from 'vue-router';

export default {
  name: 'StockDetail',
  setup() {
    const route = useRoute();
    const stockCode = route.params.stockCode;
    const startDate = route.params.startDate;
    const endDate = route.params.endDate;

    // 根据 stockCode, startDate, 和 endDate 获取并显示详细信息
    console.log(`股票代码: ${stockCode}, 开始时间: ${startDate}, 结束时间: ${endDate}`);


  }
}
</script>
