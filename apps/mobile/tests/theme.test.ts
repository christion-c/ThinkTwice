// Enforces the design guide's accessibility rule: every color pairing meets WCAG 2.2 AA in all four modes.
import {
  BACKGROUND_COLOR_TOKENS,
  getColors,
  TEXT_COLOR_TOKENS,
  type ColorScheme,
} from "../src/theme/colors";

const MODES: [ColorScheme, boolean][] = [
  ["light", false],
  ["dark", false],
  ["light", true],
  ["dark", true],
];

/** Returns a hex color's relative luminance, as defined by WCAG. */
function relativeLuminance(hex: string): number {
  const channels = [1, 3, 5].map(
    (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
  );
  const [red = 0, green = 0, blue = 0] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Returns the WCAG contrast ratio between two hex colors (1 to 21). */
function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [
    relativeLuminance(first),
    relativeLuminance(second),
  ].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

describe.each(MODES)("%s mode (high contrast: %s)", (scheme, highContrast) => {
  const colors = getColors(scheme, highContrast);

  it.each(TEXT_COLOR_TOKENS)(
    "%s text reaches 4.5:1 on every background",
    (token) => {
      for (const background of BACKGROUND_COLOR_TOKENS) {
        expect(
          contrastRatio(colors[token], colors[background]),
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );

  it("control outlines reach 3:1 on every background", () => {
    for (const background of BACKGROUND_COLOR_TOKENS) {
      expect(
        contrastRatio(colors.borderStrong, colors[background]),
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("text on primary buttons reaches 4.5:1", () => {
    expect(
      contrastRatio(colors.onPrimary, colors.primary),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe("contrastRatio", () => {
  it("matches known WCAG values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#FFFFFF")).toBeCloseTo(4.48, 2);
  });
});
