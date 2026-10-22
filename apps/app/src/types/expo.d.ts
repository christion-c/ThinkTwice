// Loads Expo's global types (e.g. process.env.EXPO_PUBLIC_*). Expo only generates its own expo-env.d.ts
// when typed routes are on, and that file is git-ignored, so CI never has it; this one is committed.
import "expo/types";
