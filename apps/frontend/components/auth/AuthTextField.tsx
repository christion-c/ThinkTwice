import { Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";

import type { ThemeColors } from "../theme";
import type { AuthFormStyles } from "./auth-form-styles";

interface AuthTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  colors: ThemeColors;
  styles: AuthFormStyles;
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
  styles,
  secureTextEntry,
  keyboardType = "default",
  textContentType,
}: AuthTextFieldProps) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        textContentType={textContentType}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}
