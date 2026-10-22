// Expo config plugin: on Windows, points every native library's Android build at a newer CMake from the Android SDK.
// The default (CMake 3.22.1) ships ninja 1.10, which can't handle the 300+ character build paths some libraries
// produce; newer ninja can, once Windows long paths are enabled (see docs/setup.md). Other systems are unaffected.
const fs = require("node:fs");
const path = require("node:path");
const { withDangerousMod } = require("expo/config-plugins");

/** Returns local.properties' contents with cmake.dir set to the given folder, keeping every other line. */
function withCmakeDir(contents, cmakeDir) {
  const lines = contents
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "" && !line.startsWith("cmake.dir="));
  lines.push(`cmake.dir=${cmakeDir.replaceAll("\\", "/")}`);
  return `${lines.join("\n")}\n`;
}

/** Adds cmake.dir to android/local.properties when building on Windows; needs ANDROID_HOME and that CMake version. */
function withWindowsCmake(config, { version }) {
  return withDangerousMod(config, [
    "android",
    (modConfig) => {
      if (process.platform !== "win32") {
        return modConfig;
      }
      const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT;
      if (sdk === undefined || sdk === "") {
        throw new Error(
          "Set ANDROID_HOME to the Android SDK folder (see docs/setup.md).",
        );
      }
      const cmakeDir = path.join(sdk, "cmake", version);
      if (!fs.existsSync(cmakeDir)) {
        throw new Error(
          `CMake ${version} isn't installed. In Android Studio, open SDK Manager > SDK Tools, tick "Show Package Details" and install CMake ${version} (see docs/setup.md).`,
        );
      }
      const file = path.join(
        modConfig.modRequest.platformProjectRoot,
        "local.properties",
      );
      const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
      fs.writeFileSync(file, withCmakeDir(existing, cmakeDir));
      return modConfig;
    },
  ]);
}

module.exports = withWindowsCmake;
module.exports.withCmakeDir = withCmakeDir;
