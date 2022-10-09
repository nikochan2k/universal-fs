import { DEFAULT_CONVERTER as c } from "../AnyConv";
import {
  hasBlob,
  hasBuffer,
  hasReadableStream,
  isNode,
} from "../converters/NodeUtil";

it("arraybuffer", async () => {
  const expected = "大谷翔平ホームラン";
  const ab = await c.converterOf("arraybuffer").convert(expected);

  {
    const actual = await c.converterOf("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c.converterOf("uint8array").convert(ab);
    const actual = await c.converterOf("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c.converterOf("blob").convert(ab);
    const actual = await c.converterOf("text").convert(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buf = await c.converterOf("buffer").convert(ab);
    const actual = await c.converterOf("text").convert(buf);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.converterOf("base64").convert(ab);
    const actual = await c
      .converterOf("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c.converterOf("binary").convert(ab);
    const actual = await c
      .converterOf("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("uint8array", async () => {
  const expected = "大谷翔平ホームラン";
  const u8 = await c.converterOf("uint8array").convert(expected);

  {
    const actual = await c.converterOf("text").convert(u8);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c.converterOf("arraybuffer").convert(u8);
    const actual = await c.converterOf("text").convert(ab);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c.converterOf("blob").convert(u8);
    const actual = await c.converterOf("text").convert(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buf = await c.converterOf("buffer").convert(u8);
    const actual = await c.converterOf("text").convert(buf);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.converterOf("base64").convert(u8);
    const actual = await c
      .converterOf("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c.converterOf("binary").convert(u8);
    const actual = await c
      .converterOf("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("buffer", async () => {
  if (!hasBuffer) {
    return;
  }

  const expected = "大谷翔平ホームラン";
  const buffer = await c.converterOf("buffer").convert(expected);

  {
    const actual = await c.converterOf("text").convert(buffer);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c.converterOf("arraybuffer").convert(buffer);
    const actual = await c.converterOf("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c.converterOf("uint8array").convert(buffer);
    const actual = await c.converterOf("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c.converterOf("blob").convert(buffer);
    const actual = await c.converterOf("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.converterOf("base64").convert(buffer);
    const actual = await c
      .converterOf("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c.converterOf("binary").convert(buffer);
    const actual = await c
      .converterOf("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("blob", async () => {
  if (!hasBlob) {
    return;
  }

  const expected = "大谷翔平ホームラン";
  const blob = await c.converterOf("blob").convert(expected);

  {
    const actual = await c.converterOf("text").convert(blob);
    expect(actual).toBe(expected);
  }

  {
    const ab = await c.converterOf("arraybuffer").convert(blob);
    const actual = await c.converterOf("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c.converterOf("uint8array").convert(blob);
    const actual = await c.converterOf("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buffer = await c.converterOf("buffer").convert(blob);
    const actual = await c.converterOf("text").convert(buffer);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c.converterOf("base64").convert(blob);
    const actual = await c
      .converterOf("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const binary = await c.converterOf("binary").convert(blob);
    const actual = await c
      .converterOf("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("base64", async () => {
  const expected = "大谷翔平ホームラン";
  const base64 = await c.converterOf("base64").convert(expected);

  {
    const actual = await c
      .converterOf("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }

  {
    const ab = await c
      .converterOf("arraybuffer")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c.converterOf("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c
      .converterOf("uint8array")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c.converterOf("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c
      .converterOf("blob")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c.converterOf("text").convert(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buf = await c
      .converterOf("buffer")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c.converterOf("text").convert(buf);
    expect(actual).toBe(expected);
  }

  {
    const binary = await c
      .converterOf("binary")
      .convert(base64, { srcStringType: "base64" });
    const actual = await c
      .converterOf("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }
});

it("binary", async () => {
  const expected = "大谷翔平ホームラン";
  const binary = await c.converterOf("binary").convert(expected);

  {
    const actual = await c
      .converterOf("text")
      .convert(binary, { srcStringType: "binary" });
    expect(actual).toBe(expected);
  }

  {
    const ab = await c
      .converterOf("arraybuffer")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c.converterOf("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const u8 = await c
      .converterOf("uint8array")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c.converterOf("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const blob = await c
      .converterOf("blob")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c.converterOf("text").convert(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const buf = await c
      .converterOf("buffer")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c.converterOf("text").convert(buf);
    expect(actual).toBe(expected);
  }

  {
    const base64 = await c
      .converterOf("base64")
      .convert(binary, { srcStringType: "binary" });
    const actual = await c
      .converterOf("text")
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
    const readable = await c.converterOf("readable").convert(expected);
    const actual = await c.converterOf("text").convert(readable);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.converterOf("readable").convert(expected);
    const ab = await c.converterOf("arraybuffer").convert(readable);
    const actual = await c.converterOf("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.converterOf("readable").convert(expected);
    const u8 = await c.converterOf("uint8array").convert(readable);
    const actual = await c.converterOf("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const readable = await c.converterOf("readable").convert(expected);
    const blob = await c.converterOf("blob").convert(readable);
    const actual = await c.converterOf("text").convert(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const readable = await c.converterOf("readable").convert(expected);
    const buf = await c.converterOf("buffer").convert(readable);
    const actual = await c.converterOf("text").convert(buf);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.converterOf("readable").convert(expected);
    const base64 = await c.converterOf("base64").convert(readable);
    const actual = await c
      .converterOf("text")
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
    const readable = await c.converterOf("readablestream").convert(expected);
    const actual = await c.converterOf("text").convert(readable);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.converterOf("readablestream").convert(expected);
    const ab = await c.converterOf("arraybuffer").convert(readable);
    const actual = await c.converterOf("text").convert(ab);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.converterOf("readablestream").convert(expected);
    const u8 = await c.converterOf("uint8array").convert(readable);
    const actual = await c.converterOf("text").convert(u8);
    expect(actual).toBe(expected);
  }

  if (hasBlob) {
    const readable = await c.converterOf("readablestream").convert(expected);
    const blob = await c.converterOf("blob").convert(readable);
    const actual = await c.converterOf("text").convert(blob);
    expect(actual).toBe(expected);
  }

  if (hasBuffer) {
    const readable = await c.converterOf("readablestream").convert(expected);
    const buf = await c.converterOf("buffer").convert(readable);
    const actual = await c.converterOf("text").convert(buf);
    expect(actual).toBe(expected);
  }

  {
    const readable = await c.converterOf("readablestream").convert(expected);
    const base64 = await c.converterOf("base64").convert(readable);
    const actual = await c
      .converterOf("text")
      .convert(base64, { srcStringType: "base64" });
    expect(actual).toBe(expected);
  }
});
