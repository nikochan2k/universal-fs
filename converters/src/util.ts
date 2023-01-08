export const DEFAULT_BUFFER_SIZE = 96 * 1024;

export function dataUrlToBase64(dataUrl: string) {
  const index = dataUrl.indexOf(",");
  if (0 <= index) {
    return dataUrl.substring(index + 1);
  }
  return dataUrl;
}

export function getType(src: unknown): string {
  const type = typeof src;
  switch (type) {
    case "function":
      // eslint-disable-next-line @typescript-eslint/ban-types
      return (src as Function).name;
    case "object":
      return (src as object).constructor.name;
  }
  return type;
}
