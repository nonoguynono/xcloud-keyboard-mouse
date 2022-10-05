export function arrayPrevOrNext<T>(array: T[], currentIndex: number, isPrev: boolean) {
  const n = array.length;
  if (n === 0) {
    throw new Error('Array must not be empty');
  }
  if (n === 1) {
    return array[currentIndex];
  }
  const i = currentIndex + (isPrev ? -1 : 1);
  return array[((i % n) + n) % n];
}
