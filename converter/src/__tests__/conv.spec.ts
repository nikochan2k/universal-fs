import { getAnyConv } from "../AnyConv";
import { AnyConvInternal } from "../converters/AbstractConverter";
import {
  hasBlob,
  hasReadable,
  hasReadableStream,
} from "../converters/Environment";

let c: AnyConvInternal;
it("initialize", async () => {
  c = (await getAnyConv()) as AnyConvInternal;
});

it("arraybuffer", async () => {
  const expected = "大谷翔平ホームラン";
  const ab = await c._of("arraybuffer").from(expected);

  {
    const actual = await c._of("text").from(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c._of("uint8array").from(ab);
    const actual = await c._of("text").from(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c._of("blob").from(ab);
    const actual = await c._of("text").from(blob);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c._of("base64").from(ab);
    const actual = await c
      ._of("text")
      .from(base64, { inputStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c._of("binary").from(ab);
    const actual = await c
      ._of("text")
      .from(binary, { inputStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("uint8array", async () => {
  const expected = "大谷翔平ホームラン";
  const u8 = await c._of("uint8array").from(expected);

  {
    const actual = await c._of("text").from(u8);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c._of("arraybuffer").from(u8);
    const actual = await c._of("text").from(ab);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c._of("blob").from(u8);
    const actual = await c._of("text").from(blob);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c._of("base64").from(u8);
    const actual = await c
      ._of("text")
      .from(base64, { inputStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c._of("binary").from(u8);
    const actual = await c
      ._of("text")
      .from(binary, { inputStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("blob", async () => {
  if (!hasBlob) {
    return;
  }

  const expected = "大谷翔平ホームラン";
  const blob = await c._of("blob").from(expected);

  {
    const actual = await c._of("text").from(blob);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c._of("arraybuffer").from(blob);
    const actual = await c._of("text").from(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c._of("uint8array").from(blob);
    const actual = await c._of("text").from(u8);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c._of("base64").from(blob);
    const actual = await c
      ._of("text")
      .from(base64, { inputStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c._of("binary").from(blob);
    const actual = await c
      ._of("text")
      .from(binary, { inputStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("base64", async () => {
  const expected = "大谷翔平ホームラン";
  const base64 = await c._of("base64").from(expected);

  {
    const actual = await c
      ._of("text")
      .from(base64, { inputStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const ab = await c
      ._of("arraybuffer")
      .from(base64, { inputStringType: "base64" });
    const actual = await c._of("text").from(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c
      ._of("uint8array")
      .from(base64, { inputStringType: "base64" });
    const actual = await c._of("text").from(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c
      ._of("blob")
      .from(base64, { inputStringType: "base64" });
    const actual = await c._of("text").from(blob);
    expect(actual).toBe(expected);
  }

  {
    const binary = await c
      ._of("binary")
      .from(base64, { inputStringType: "base64" });
    const actual = await c
      ._of("text")
      .from(binary, { inputStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("binary", async () => {
  const expected = "大谷翔平ホームラン";
  const binary = await c._of("binary").from(expected);

  {
    const actual = await c
      ._of("text")
      .from(binary, { inputStringType: "binary" });
    expect(actual).toBe(expected);
  }

  {
    const ab = await c
      ._of("arraybuffer")
      .from(binary, { inputStringType: "binary" });
    const actual = await c._of("text").from(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c
      ._of("uint8array")
      .from(binary, { inputStringType: "binary" });
    const actual = await c._of("text").from(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c
      ._of("blob")
      .from(binary, { inputStringType: "binary" });
    const actual = await c._of("text").from(blob);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c
      ._of("base64")
      .from(binary, { inputStringType: "binary" });
    const actual = await c
      ._of("text")
      .from(base64, { inputStringType: "base64" });
    expect(actual).toBe(expected);
  }
});

it("readable", async () => {
  if (!hasReadable) {
    return;
  }

  const expected = "大谷翔平ホームラン";

  {
    const readable = await c._of("readable").from(expected);
    const actual = await c._of("text").from(readable);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readable").from(expected);
    const ab = await c._of("arraybuffer").from(readable);
    const actual = await c._of("text").from(ab);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readable").from(expected);
    const u8 = await c._of("uint8array").from(readable);
    const actual = await c._of("text").from(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const readable = await c._of("readable").from(expected);
    const blob = await c._of("blob").from(readable);
    const actual = await c._of("text").from(blob);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readable").from(expected);
    const base64 = await c._of("base64").from(readable);
    const actual = await c
      ._of("text")
      .from(base64, { inputStringType: "base64" });
    expect(actual).toBe(expected);
  }
});

it("readablestream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const expected = "大谷翔平ホームラン";

  {
    const readable = await c._of("readablestream").from(expected);
    const actual = await c._of("text").from(readable);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readablestream").from(expected);
    const ab = await c._of("arraybuffer").from(readable);
    const actual = await c._of("text").from(ab);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readablestream").from(expected);
    const u8 = await c._of("uint8array").from(readable);
    const actual = await c._of("text").from(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const readable = await c._of("readablestream").from(expected);
    const blob = await c._of("blob").from(readable);
    const actual = await c._of("text").from(blob);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readablestream").from(expected);
    const base64 = await c._of("base64").from(readable);
    const actual = await c
      ._of("text")
      .from(base64, { inputStringType: "base64" });
    expect(actual).toBe(expected);
  }
});
