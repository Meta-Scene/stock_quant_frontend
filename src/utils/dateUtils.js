/* 日期格式化 */
export function formatDate(inputDate) {
  const date = new Date(inputDate);
  // YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
