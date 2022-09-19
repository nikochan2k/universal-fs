export function isURL(input: string) {
  if (!input) {
    return false;
  }
  return /^(file|http|https|blob|data):/.test(input);
}

export function isBASE64(input: string) {
  if (!input || input.length % 4 !== 0) {
    return false;
  }
  const chunk = input.substring(0, 96);
  return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
    chunk
  );
}

export function isHEX(input: string) {
  if (!input) {
    return false;
  }
  const chunk = input.substring(0, 96);
  return /^[A-Fa-f0-9]+$/.test(chunk);
}
