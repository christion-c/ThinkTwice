import { Ionicons } from "@expo/vector-icons";
import { cssInterop } from "nativewind";
import { Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import type { KeyboardAvoidingViewProps } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

import { useThemeColors } from "@/contexts/AppPreferencesProvider";
import type { StepFlowStepConfig } from "@/hooks/useStepFlow";
import { withAlpha } from "@/lib/color";

// Lets NativeWind's className reach keyboard-controller's
// KeyboardAvoidingView the way it reaches React Native's own.
cssInterop(KeyboardAvoidingView, { className: "style" });

interface StepFlowModalProps<K extends string> {
  step: StepFlowStepConfig<K> | null;
  isLastStep: boolean;
  stepIndex: number;
  totalSteps: number;
  draft: string;
  onChangeDraft: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  webKeyboardInset: number;
  // Validation message for the current answer (from useStepFlow).
  error?: string | null;
  // Defaults match fuel.tsx's tuning (iOS: "position"/24). finance.tsx
  // passes its own ("padding"/0 - Android's default is "padding" too)
  // instead - predates this component and
  // the commit history that changed it has no more specific reasoning
  // than "demo day" fixes, so the actual on-device iOS difference this
  // was tuned for isn't recoverable from history. Left as two different
  // values rather than guessed-unified, since this environment has no
  // iOS simulator to verify a change against.
  keyboardBehavior?: KeyboardAvoidingViewProps["behavior"];
  keyboardVerticalOffset?: number;
}

// Renders the current step of a useStepFlow wizard as a bottom-anchored
// modal - a progress bar plus an icon badge per step, rather than a bare
// "title, hint, text field" form, so a 4-step wizard reads as one guided
// flow with a sense of where you are in it instead of a plain form.
export default function StepFlowModal<K extends string>({
  step,
  isLastStep,
  stepIndex,
  totalSteps,
  draft,
  onChangeDraft,
  onCancel,
  onConfirm,
  webKeyboardInset,
  error = null,
  // Android uses "padding": keyboard-controller's KeyboardAvoidingView
  // (unlike React Native's own) tracks the keyboard inside a Modal even
  // with edge-to-edge on, and padding the bottom-anchored sheet up by
  // the keyboard height is what keeps the input visible. React Native's
  // "height" behavior did nothing there - the window never resizes.
  keyboardBehavior = Platform.OS === "ios" ? "position" : "padding",
  keyboardVerticalOffset = Platform.OS === "ios" ? 24 : 0,
}: StepFlowModalProps<K>) {
  const colors = useThemeColors();

  return (
    <Modal transparent visible={Boolean(step)} animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        className="flex-1 justify-end bg-[rgba(4,8,12,0.68)]"
      >
        {/* marginBottom is a runtime pixel value from useWebKeyboardInset, so it
            stays an inline style - Tailwind classes can't express an
            unbounded runtime number. */}
        <View style={{ marginBottom: webKeyboardInset }} className="px-md pb-lg">
          <View className="gap-sm rounded-lg border border-border bg-surface p-lg">
            {totalSteps > 1 ? (
              <View className="flex-row gap-xs">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <View
                    key={index}
                    className={`h-1.5 flex-1 rounded-round ${index <= stepIndex ? "bg-accent" : ""}`}
                    style={index <= stepIndex ? undefined : { backgroundColor: withAlpha(colors.text, 0.14) }}
                  />
                ))}
              </View>
            ) : null}

            <View className="flex-row items-center gap-sm">
              {step?.icon ? (
                <View
                  className="h-9 w-9 items-center justify-center rounded-round"
                  style={{ backgroundColor: withAlpha(colors.accent, 0.16) }}
                >
                  <Ionicons name={step.icon} size={18} color={colors.accent} />
                </View>
              ) : null}
              <Text className="flex-1 text-xl font-bold text-text">{step?.title}</Text>
            </View>

            <Text className="text-sm leading-5 text-textMuted">{step?.hint}</Text>
            {step?.choices ? (
              <View className="flex-row flex-wrap gap-sm">
                {step.choices.map((choice) => {
                  const selected = draft === choice.value;
                  return (
                    <Pressable
                      key={choice.value}
                      onPress={() => onChangeDraft(choice.value)}
                      className={`min-w-[45%] flex-1 items-center rounded-md border px-md py-3 ${
                        selected ? "border-accent" : "border-border bg-surfaceSoft"
                      }`}
                      style={selected ? { backgroundColor: withAlpha(colors.accent, 0.16) } : undefined}
                    >
                      <Text className={`text-body font-semibold ${selected ? "text-accent" : "text-text"}`}>
                        {choice.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <TextInput
                value={draft}
                onChangeText={onChangeDraft}
                keyboardType={step?.keyboardType ?? "default"}
                autoCapitalize={step?.autoCapitalize ?? "sentences"}
                autoCorrect={step?.autoCorrect ?? true}
                className="rounded-md border border-border bg-surfaceSoft px-md py-3 text-base text-text"
                placeholder={step?.placeholder}
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={onConfirm}
                // Keep focus (and the keyboard) on submit: the same field
                // is reused for the next step, so blurring would drop and
                // re-raise the keyboard between every question.
                submitBehavior="submit"
                returnKeyType={isLastStep ? "done" : "next"}
                autoFocus
              />
            )}
            {error ? <Text className="text-sm text-danger">{error}</Text> : null}
            <View className="mt-xs flex-row justify-end gap-sm">
              <Pressable onPress={onCancel} className="rounded-md border border-border px-md py-2.5">
                <Text className="text-sm font-semibold text-text">Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirm} className="rounded-md bg-accent px-md py-2.5">
                <Text className="text-sm font-bold text-accentDeep">{isLastStep ? "Done" : "Next"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
