// Tab config for BottomNav, shared across all platforms - PageScaffold
// is a single app-shell layout now, no separate website variant.
export const navTabs = [
  { label: "Finance", path: "/finance", icon: "wallet-outline", activeIcon: "wallet" },
  { label: "Home", path: "/", icon: "home-outline", activeIcon: "home" },
  { label: "Profile", path: "/profile", icon: "person-outline", activeIcon: "person" },
  { label: "Fuel", path: "/fuel", icon: "car-outline", activeIcon: "car" },

  // nutrition is not complete do not use while this is commented out
  // { label: "Nutrition", path: "/nutrition", icon: "restaurant-outline", activeIcon: "restaurant" },

] as const;

export type NavTabLabel = (typeof navTabs)[number]["label"];
