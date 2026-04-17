export function formatDate(value: string) {
  if (!value) {
    return '-';
  }

  const hasTimezone = /Z$|[+-]\d{2}:?\d{2}$/.test(value);
  const normalizedValue = hasTimezone ? value : `${value.replace(' ', 'T')}+07:00`;
  const date = new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false
  });
}
