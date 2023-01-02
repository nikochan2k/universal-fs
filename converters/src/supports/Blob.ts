import { isReactNative } from "../util";

export let hasBlob = false;
export let hasTextOnBlob = false;
export let hasStreamOnBlob = false;
export let hasArrayBufferOnBlob = false;
export let hasReadAsArrayBufferOnBlob = false;
export let hasReadAsBinaryStringOnBlob = false;
if (typeof Blob === "function") {
  hasBlob = true;
  if (typeof Blob.prototype.text === "function") {
    hasTextOnBlob = true;
  }
  if (typeof Blob.prototype.stream === "function") {
    hasStreamOnBlob = true;
  }
  if (typeof Blob.prototype.arrayBuffer === "function") {
    hasArrayBufferOnBlob = true;
  }
  if (!isReactNative) {
    hasReadAsArrayBufferOnBlob =
      typeof FileReader.prototype.readAsArrayBuffer === "function";
    hasReadAsBinaryStringOnBlob =
      typeof FileReader.prototype.readAsBinaryString === "function";
  }
}

export function handleFileReader<T extends string | ArrayBuffer>(
  trigger: (reader: FileReader) => void,
  transform: (data: string | ArrayBuffer | null) => T
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = function (ev) {
      reject(reader.error || ev);
    };
    reader.onload = function () {
      resolve(transform(reader.result));
    };
    trigger(reader);
  });
}
