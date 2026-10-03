import PageScaffold from "@/components/layout/PageScaffold";
import { Card, CardText, CardTitle } from "@/components/ui";

// Nutrition daily check-ins are paused (not this screen's decision -
// see team commit "undid nutrition page changes", Aug 2026). Kept as a
// real, working route rather than commented-out dead code so
// /nutrition still renders something honest instead of a broken page
// if anyone reaches it.
export default function Nutrition() {
  return (
    <PageScaffold title="Nutrition" subtitle="This feature isn't available yet." showNav>
      <Card surface>
        <CardTitle>Check back soon</CardTitle>
        <CardText tight>
          Daily nutrition check-ins are paused while the team finishes this feature. Your fuel and
          finance data on the other screens aren’t affected.
        </CardText>
      </Card>
    </PageScaffold>
  );
}
