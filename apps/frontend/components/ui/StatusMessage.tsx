import { Text } from "react-native";

// A conditionally-shown one-line error or success message. Every form in
// the app follows the same "{message ? <Text>...</Text> : null}" pattern -
// this bundles that check with the message's styling.
interface StatusMessageProps {
  // Falsy (empty string, null, undefined) means "nothing to show".
  message: string | null | undefined;
  tone: "error" | "success";
}

export default function StatusMessage({ message, tone }: StatusMessageProps) {
  if (!message) {
    return null;
  }

  const toneClass = tone === "error" ? "text-danger" : "text-success";

  return <Text className={`text-sm ${toneClass}`}>{message}</Text>;
}
