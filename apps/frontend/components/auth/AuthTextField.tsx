import { Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";

import type { ThemeColors } from "../theme";

interface AuthTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: ThemeColors;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  textContentType?: TextInputProps["textContentType"];
}

/** Labeled text field used by every auth form's email/password inputs. */
export default function AuthTextField({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
  secureTextEntry,
  keyboardType = "default",
  textContentType,
}: AuthTextFieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-[13px] font-semibold text-textMuted">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        textContentType={textContentType}
        className="rounded-sm border border-border bg-surfaceSoft px-sm py-3 text-base text-text"
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}
