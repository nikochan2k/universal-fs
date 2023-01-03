import r2b from "../../../converters/readable/binary";
import { createReadable } from "../../supports/Reader";

it("convert", async () => {
  const src = createReadable([97, 98, 99]);
  const actual = await r2b.convert(src);
  expect(actual).toBe("abc");
});
