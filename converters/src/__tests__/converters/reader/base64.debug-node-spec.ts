import r2b from "../../../converters/readable/base64";
import { createReadable } from "../../supports/Reader";

it("convert", async () => {
  const src = createReadable([97, 98, 99]);
  const actual = await r2b.convert(src);
  expect(actual).toBe("YWJj");
});
