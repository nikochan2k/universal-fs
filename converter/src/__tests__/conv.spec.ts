import { getAnyConv } from "../AnyConv";
import { AnyConvInternal } from "../converters/AbstractConverter";
import { hasBlob, hasReadableStream, isNode } from "../converters/NodeUtil";

let c: AnyConvInternal;
it("initialize", async () => {
  c = (await getAnyConv()) as AnyConvInternal;
});

it("arraybuffer", async () => {
  const expected = "大谷翔平ホームラン";
  const ab = await c._of("arraybuffer").convert(expected);

  {
    const actual = await c._of("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c._of("uint8array").convert(ab);
    const actual = await c._of("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c._of("blob").convert(ab);
    const actual = await c._of("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c._of("base64").convert(ab);
    const actual = await c
      ._of("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c._of("binary").convert(ab);
    const actual = await c
      ._of("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("uint8array", async () => {
  const expected = "大谷翔平ホームラン";
  const u8 = await c._of("uint8array").convert(expected);

  {
    const actual = await c._of("text").convert(u8);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c._of("arraybuffer").convert(u8);
    const actual = await c._of("text").convert(ab);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c._of("blob").convert(u8);
    const actual = await c._of("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c._of("base64").convert(u8);
    const actual = await c
      ._of("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c._of("binary").convert(u8);
    const actual = await c
      ._of("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("blob", async () => {
  if (!hasBlob) {
    return;
  }

  const expected = "大谷翔平ホームラン";
  const blob = await c._of("blob").convert(expected);

  {
    const actual = await c._of("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c._of("arraybuffer").convert(blob);
    const actual = await c._of("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c._of("uint8array").convert(blob);
    const actual = await c._of("text").convert(u8);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c._of("base64").convert(blob);
    const actual = await c
      ._of("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c._of("binary").convert(blob);
    const actual = await c
      ._of("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("base64", async () => {
  const expected = "大谷翔平ホームラン";
  const base64 = await c._of("base64").convert(expected);

  {
    const actual = await c
      ._of("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const ab = await c
      ._of("arraybuffer")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c._of("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c
      ._of("uint8array")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c._of("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c
      ._of("blob")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c._of("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const binary = await c
      ._of("binary")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c
      ._of("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("binary", async () => {
  const expected = "大谷翔平ホームラン";
  const binary = await c._of("binary").convert(expected);

  {
    const actual = await c
      ._of("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }

  {
    const ab = await c
      ._of("arraybuffer")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c._of("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c
      ._of("uint8array")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c._of("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c
      ._of("blob")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c._of("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c
      ._of("base64")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c
      ._of("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }
});

it("readable", async () => {
  if (!isNode) {
    return;
  }

  const expected = "大谷翔平ホームラン";

  {
    const readable = await c._of("readable").convert(expected);
    const actual = await c._of("text").convert(readable);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readable").convert(expected);
    const ab = await c._of("arraybuffer").convert(readable);
    const actual = await c._of("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readable").convert(expected);
    const u8 = await c._of("uint8array").convert(readable);
    const actual = await c._of("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const readable = await c._of("readable").convert(expected);
    const blob = await c._of("blob").convert(readable);
    const actual = await c._of("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readable").convert(expected);
    const base64 = await c._of("base64").convert(readable);
    const actual = await c
      ._of("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }
});

it("readablestream", async () => {
  if (!hasReadableStream) {
    return;
  }

  const expected = "大谷翔平ホームラン";

  {
    const readable = await c._of("readablestream").convert(expected);
    const actual = await c._of("text").convert(readable);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readablestream").convert(expected);
    const ab = await c._of("arraybuffer").convert(readable);
    const actual = await c._of("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readablestream").convert(expected);
    const u8 = await c._of("uint8array").convert(readable);
    const actual = await c._of("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const readable = await c._of("readablestream").convert(expected);
    const blob = await c._of("blob").convert(readable);
    const actual = await c._of("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c._of("readablestream").convert(expected);
    const base64 = await c._of("base64").convert(readable);
    const actual = await c
      ._of("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }
});
