import BottomNav from "../components/BottomNav";
import PageScaffold from "../components/PageScaffold";
import Card from "../components/ui/Card";
import CardText from "../components/ui/CardText";
import CardTitle from "../components/ui/CardTitle";

// Nutrition daily check-ins are paused (not this screen's decision -
// see team commit "undid nutrition page changes", Aug 2026). Kept as a
// real, working route rather than commented-out dead code so
// /nutrition still renders something honest instead of a broken page
// if anyone reaches it.
export default function Nutrition() {
  return (
    <PageScaffold title="Nutrition" subtitle="This feature isn't available yet." footer={<BottomNav />}>
      <Card>
        <CardTitle>Check back soon</CardTitle>
        <CardText tight>
          Daily nutrition check-ins are paused while the team finishes this feature. Your fuel and
          finance data on the other screens aren’t affected.
        </CardText>
      </Card>
    </PageScaffold>
  );
}
