import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);
const { withCmakeDir } = require("../../plugins/with-windows-cmake.js");

describe("withCmakeDir", () => {
  it("adds cmake.dir with forward slashes", () => {
    assert.equal(
      withCmakeDir("", String.raw`C:\Android\Sdk\cmake\4.1.2`),
      "cmake.dir=C:/Android/Sdk/cmake/4.1.2\n",
    );
  });

  it("keeps other settings and replaces an old cmake.dir", () => {
    assert.equal(
      withCmakeDir(
        "sdk.dir=C:/Sdk\r\ncmake.dir=C:/old\n",
        "C:/Sdk/cmake/4.1.2",
      ),
      "sdk.dir=C:/Sdk\ncmake.dir=C:/Sdk/cmake/4.1.2\n",
    );
  });
});
