export function randomInt(min: number, max: number, filterTails = false) {
  if (max - min < 2) {
    throw new Error('max - min 必须大于2')
  }
  let result = Math.floor((max - min) * Math.random() + min)
  while (filterTails && (result === min || result === max)) {
    result = Math.floor((max - min) * Math.random() + min)
  }
  return result
}
