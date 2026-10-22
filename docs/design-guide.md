# ThinkTwice Design Guide

_Status: approved. Last updated: 2026-10-22._

How ThinkTwice looks, feels and talks. It applies to every screen on iOS, Android and the web.

## Principles
1. **One thing at a time.** Each screen has one main purpose and one main action. Show the most important number first and everything else after.
2. **Calm, not alarming.** No flashing, no red for spending, no countdowns, no pressure.
3. **Never shame.** Spending is information, not failure. Describe what's happening and what the user *could* do; never judge.
4. **Fast to use.** Logging an expense takes 3 taps or fewer. Common actions are always within thumb reach.
5. **Forgiving.** Everyday actions can be undone or edited, and anything permanent asks first. Nothing important is lost by a mis-tap.
6. **Plain language.** No finance jargon. If a 12-year-old wouldn't understand a word, use a different one.

## Logo
- Source file: `docs/brand/app-logo.png`. A magnifying glass split into espresso brown (a `$`) and pumpkin orange (a drop), on a cream background, matching the palette below.
- The current file is 512×512. App store icons need a **1024×1024** source (ideally a vector SVG), plus an Android adaptive icon with the artwork inside the safe zone. Create these before the first store release.
- Always pair the logo with the name "ThinkTwice" as text, and give it an accessible label ("ThinkTwice logo") wherever it appears in the app.

## Layout
- **Mobile first.** Design for a phone, then let it breathe on bigger screens.
- **Wide screens:** content sits in a centered column, max **640px** wide for forms and lists, **960px** for the dashboard. No stretched, edge-to-edge text.
- **Spacing scale** (use only these values): 4, 8, 12, 16, 24, 32, 48, 64.
- Screen side padding: **16** on phones, **24** on tablets and desktop.
- Generous whitespace. When a screen feels busy, remove something rather than shrinking it.
- **Main action:** a single primary button, bottom of the screen on phones (thumb reach), inline on desktop.

## Typography
- **Font:** the platform's system font (San Francisco on iOS, Roboto on Android, the system UI font on the web). It is fast, familiar and highly readable.
- **Scale:**

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| Display | 34 / 40 | Bold | The one key number on a screen (e.g. month total) |
| Title | 24 / 32 | Semibold | Screen titles |
| Heading | 18 / 24 | Semibold | Section and card titles |
| Body | 16 / 24 | Regular | Default text (never smaller for body text) |
| Caption | 14 / 20 | Regular | Secondary details, labels |

- Respect the user's system text size. Layouts must still work at 200% text size.
- Left-aligned text. No justified text, no long paragraphs, no ALL CAPS sentences.
- Money uses tabular (fixed-width) numbers so amounts line up.

## Color
A warm fall/harvest palette carried over from the previous version of ThinkTwice: espresso-brown neutrals, a pumpkin-orange accent, olive-green success and brick-red errors. Light and dark mode share the same hues with inverted lightness, so switching modes still feels like the same app.

Every text color meets the WCAG 2.2 AA contrast minimum of **4.5:1** against **every** background it can appear on (`background`, `surface` and `surfaceSoft`), in all four modes (light, dark and high contrast for each). Interactive controls, their outlines, focus indicators and meaningful chart marks meet **3:1** (WCAG 2.2 non-text contrast). `primary`, `teal` and `gold` in light mode were darkened slightly from the previous version to pass on `surfaceSoft`. Color is never the only way information is shown; it is always paired with a label, icon or position.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#FBF2E4` | `#1B1410` | Screen background (warm cream / espresso) |
| `surface` | `#FFFFFF` | `#241B14` | Cards, sheets, inputs |
| `surfaceSoft` | `#F6E9D3` | `#2E2318` | Subtle fills: chips, selected rows, inset areas |
| `border` | `rgba(43, 27, 14, 0.12)` | `rgba(245, 230, 210, 0.10)` | Decorative outlines only (cards, dividers) |
| `borderStrong` | `#957B61` | `#88725D` | Outlines of interactive controls: inputs, checkboxes, toggles, outlined buttons (at least 3:1 on every background) |
| `text` | `#2B1B10` | `#F1E4D4` | Main text (soft cream in dark mode, never pure white) |
| `textMuted` | `#7C6248` | `#B49A80` | Secondary text |
| `primary` | `#AD4B09` | `#F0913D` | Main actions, links, focus (pumpkin orange) |
| `onPrimary` | `#FFF8EE` | `#241608` | Text on `primary` |
| `success` | `#55731F` | `#A9C15E` | Under budget, saved, completed (olive green) |
| `error` | `#B23A1E` | `#E2673F` | **Only** for real errors (failed to save, invalid input). Never for spending |
| `essential` | `#0E7567` | `#4FBFAE` | Essential spending (steady teal) |
| `discretionary` | `#896108` | `#E9BC4F` | Discretionary spending and gentle heads-ups (harvest gold) |
| `chartBlue` | `#2E68AE` | `#74A9E0` | Extra chart series |
| `chartBerry` | `#9A3D8E` | `#D184C8` | Extra chart series |

**Charts** use `essential`, `discretionary`, `chartBlue` and `chartBerry`, never `success` or `error`, so a chart series never reads as "good" or "bad."

### High contrast mode
A setting that keeps every accent color but pushes neutrals to their extremes and thickens borders:

| Token | Light | Dark |
|---|---|---|
| `background`, `surface` | `#FFFFFF` | `#000000` |
| `surfaceSoft` | `#F8EFDD` | `#1A130D` |
| `border` | `rgba(43, 27, 14, 0.5)` | `rgba(245, 230, 210, 0.4)` |
| `text` | `#000000` | `#FFFFFF` |
| `textMuted` | `#2B1B10` | `#F1E4D4` |

- Follows the system light/dark setting, with a manual override and a high contrast toggle in settings.
- Colors are defined once in `apps/mobile/src/theme/` and used by name. No hard-coded colors in components.

## Components
- **Touch targets:** at least **44×44** points (iOS) / **48×48** dp (Android and web), with at least 8 between targets.
- **Cards:** the main building block. Rounded corners (16), `surface` color, `border` outline. One idea per card.
- **Buttons:** one primary button per screen. Secondary actions are outlined or text buttons. Labels are verbs ("Save expense", not "OK").
- **Focus:** a visible 2px `primary` outline on every focused control, never removed or hidden behind other content.
- **Forms:** one column, inputs outlined with `borderStrong`, labels above inputs (never placeholder-only), amount field gets a number keypad, sensible defaults (today's date, last-used category).
- **Lists:** most recent first, grouped by day, with clear empty states.
- **Charts:** simple bar or line charts only. Every chart has a one-sentence text summary above it ("You spent most on coffee this month"). No pie charts.
- **Confirmations:** only for destructive actions (delete). Everything else saves immediately and offers **Undo**.

## Motion
- Short and purposeful (150–250 ms), used only to show what changed.
- No bouncing, looping or decorative animation.
- Respect the system "reduce motion" setting: replace movement with simple fades or nothing.

## Accessibility (WCAG 2.2 AA)
- Every interactive element has an accessible label and role for screen readers (VoiceOver, TalkBack, web screen readers).
- Amounts are read in full ("thirty-five dollars"), and charts have a text alternative.
- Full keyboard support on the web, with a clearly visible focus outline (`primary`).
- Logical reading and focus order on every screen.
- Error messages are announced to screen readers and say how to fix the problem.
- Test with VoiceOver, TalkBack and keyboard-only navigation before a feature is done.

## Insights and forecasts
- **At most one insight on screen at a time.** The user can dismiss it.
- Structure: **what's happening → where it's heading → one optional idea.**
- Use round, friendly numbers ("about $140"), not false precision ("$139.62").
- Use **"at this pace"** language. Forecasts describe a trend, not a prediction of the user's character.
- Celebrate progress, however small.

## Writing style
- **Voice:** a supportive friend who's good with money. Warm, honest, brief. A touch of humor is fine; sarcasm is not.
- **Short.** One idea per sentence. Most messages fit in two lines on a phone.
- **"You" and "your."** Talk to the user, not about them.
- **No judgment words:** never "bad", "wasted", "failed", "overspent", "guilty", "should have".
- **Suggestions are optional:** "maybe", "you could", "want to…?" Never "you must" or "you need to".

| Instead of | Write |
|---|---|
| "You overspent on coffee!" | "Coffee's at $35 this week. At this pace, that's about $140 this month." |
| "Budget exceeded." | "You're $20 past your monthly budget. Want to look at where it went?" |
| "Error: invalid input." | "Amount needs to be a number, like 4.50." |
| "No data." | "Log your first expense and we'll start spotting patterns." |
| "Are you sure?" | "Delete this expense? You can't undo this." |

## Notifications
v1 has no notifications. When they arrive in a later version:
- Off by default; the user opts in to each type.
- At most one per day, never at night (respect the user's timezone).
- Same tone rules as the app. Never guilt-based.
