import type { PropsWithChildren } from "react";

// Overrides expo-router's default root HTML wrapper. Its built-in
// ScrollViewStyleReset only sets height: 100% on html/body/#root and
// leaves #root as display: flex with no explicit flex-direction (so it
// defaults to row) - no width rule at all. That's unnoticed on typical
// phone aspect ratios, but on an unusually tall/narrow screen (reported
// on a Motorola Razr's cover-fold-style tall display) the root's child
// ends up sized to its row-flex content width/height instead of the
// actual viewport, leaving blank space on the right and bottom.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <style
          id="expo-reset"
          dangerouslySetInnerHTML={{
            __html: `
html, body, #root {
  height: 100%;
  width: 100%; /* the actual fix: expo-router's reset never sets this */
  margin: 0;
  padding: 0;
}
body {
  overflow: hidden; /* the app's own ScrollView handles scrolling */
}
#root {
  display: flex;
  flex-direction: column; /* row (the browser default) is wrong for a full-screen app */
}
`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
