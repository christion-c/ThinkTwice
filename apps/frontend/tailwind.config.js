/**
 * Tailwind tokens mirror apps/frontend/lib/theme.ts exactly, so
 * migrating a screen from StyleSheet to className produces the same
 * pixel values as before. Colors are CSS custom properties (see
 * components/layout/ThemeVarsRoot.tsx) rather than fixed hex values, because
 * this app's theme isn't just light/dark - colorMode and highContrast
 * combine into four palettes chosen at runtime (see theme.ts's
 * getColors()), which a static Tailwind theme can't express on its own.
 */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        surfaceSoft: "var(--color-surface-soft)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        textMuted: "var(--color-text-muted)",
        accent: "var(--color-accent)",
        accentDeep: "var(--color-accent-deep)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
        teal: "var(--color-teal)",
        blue: "var(--color-blue)",
        berry: "var(--color-berry)",
        gold: "var(--color-gold)",
      },
      // xs-xl: tightened twice now (originally 6/10/16/24/32, then
      // 4/8/12/16/24) for compact spacing *within* a component - icon-
      // to-label gaps, row padding, that kind of thing. 2xl/3xl are a
      // separate, deliberately generous tier added for spacing *between*
      // sections on a screen, once the bordered-card layout that used to
      // separate sections visually went away - without them, a tighter
      // xl was the only gap available between sections too, which read
      // as everything crammed into corners with nothing to tell one
      // section from the next.
      spacing: {
        xs: "3px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "28px",
        "3xl": "40px",
      },
      borderRadius: {
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "28px",
        round: "999px",
      },
      // caption: the one arbitrary text-[13px] size that had emerged as
      // a de-facto standard, independently hand-rolled across ~20 call
      // sites (metric rows, chips, form labels, list captions) with no
      // shared token. body: CardText's own 15px, now referenced by name
      // instead of hardcoded in that one file. pageTitle/pageTitleCompact:
      // PageScaffoldBody's page-header tier, the one size class not
      // reused anywhere else, tokenized for the same "name it instead of
      // a bare number" consistency as the others. None of these set a
      // fixed line-height, so existing per-site leading-* overrides
      // (CardText's tight/non-tight split, etc.) keep working unchanged.
      fontSize: {
        caption: "13px",
        body: "15px",
        pageTitleCompact: "28px",
        pageTitle: "32px",
      },
    },
  },
  plugins: [],
};
