function padStart(n: number, maxLength = 2) {
  return n.toString().padStart(maxLength, '0')
}

export function formatTimeForFileName(date = new Date()) {
  return `${date.getFullYear()}-${padStart(date.getMonth() + 1)}-${padStart(date.getDate())}-${padStart(date.getHours())}-${padStart(date.getMinutes())}-${padStart(date.getSeconds())}-${padStart(date.getMilliseconds(), 3)}`
}
