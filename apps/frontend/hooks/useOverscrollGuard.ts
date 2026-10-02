import { useRef } from "react";
import type { ScrollView } from "react-native";

// Belt-and-suspenders against rubber-band overscroll: the ScrollView using
// this already sets bounces/alwaysBounceVertical/overScrollMode false and
// CSS overscroll-none, but that quartet still isn't airtight on every
// platform (Safari in particular can rubber-band past the content edge
// regardless). This manually snaps back to the last valid offset as a
// final catch, rather than trusting any single native/CSS flag alone.
// Used by PageScaffold.tsx.
// Generic over the ref type so PageScaffold can hand the same ref to
// either a plain ScrollView or keyboard-controller's
// KeyboardAwareScrollView (whose ref type extends ScrollView).
export function useOverscrollGuard<T extends Pick<ScrollView, "scrollTo"> = ScrollView>() {
  const scrollRef = useRef<T>(null);

  const handleScroll = ({
    nativeEvent,
  }: {
    nativeEvent: { contentOffset: { y: number }; contentSize: { height: number }; layoutMeasurement: { height: number } };
  }) => {
    const maxOffset = Math.max(nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height, 0);
    if (nativeEvent.contentOffset.y > maxOffset) {
      scrollRef.current?.scrollTo({
        y: maxOffset,
        animated: false,
      });
    }
  };

  return { scrollRef, handleScroll };
}
