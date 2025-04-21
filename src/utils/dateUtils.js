/* 日期格式化 */
export function formatDate(inputDate) {
  const date = new Date(inputDate);
  // YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* 最初默认日期定位 */
export function redictToNewDay() {
  const currentDate = new Date();
  const currentHour = currentDate.getHours();
  const currentDay = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  const getLastFriday = (baseDate) => {
    const day = baseDate.getDay();
    const diff = day >= 5 ? day - 5 : day + 2; // 如果是周六(6)日(0)，+2 或 -5
    const lastFriday = new Date(baseDate);
    lastFriday.setDate(baseDate.getDate() - diff);
    return lastFriday;
  };

  let targetDate;

  if (currentDay === 0 || currentDay === 6) {
    // 周六、周日 → 显示本周五
    targetDate = getLastFriday(currentDate);
  } else if (currentDay === 1 && currentHour < 18) {
    // 周一18点前 → 显示上周五
    const lastFriday = new Date(currentDate);
    lastFriday.setDate(currentDate.getDate() - 3);
    targetDate = lastFriday;
  } else if (currentHour < 18) {
    // 其他工作日18点前 → 显示昨天
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);
    targetDate = yesterday;
  } else {
    // 其他工作日18点后 → 显示今天
    targetDate = currentDate;
  }

  return formatDate(targetDate);
}
