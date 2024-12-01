// IP地址解析函数
const getLocationByIp = async (ip: string): Promise<string> => {
  if (ip === '127.0.0.1' || ip === 'localhost') {
    return '本地开发环境';
  }
  try {
    const response = await fetch(`https://ip.useragentinfo.com/json/${ip}`);
    const data = await response.json();
    return `${data.country}${data.province}${data.city}`;
  } catch (error) {
    console.error('IP地址解析失败:', error);
    return '-';
  }
};
const formatTime = (time: string) => {
  const date = new Date(time);
  return {
    full: date.toLocaleString('zh-CN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    }),
    short: date.toLocaleString('zh-CN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
};
export { getLocationByIp, formatTime };
