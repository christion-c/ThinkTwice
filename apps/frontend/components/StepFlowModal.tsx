import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import type { KeyboardAvoidingViewProps } from "react-native";

import type { StepFlowStepConfig } from "../hooks/useStepFlow";
import type { ThemeColors } from "./theme";

interface StepFlowModalProps<K extends string> {
  step: StepFlowStepConfig<K> | null;
  isLastStep: boolean;
  draft: string;
  onChangeDraft: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  webKeyboardInset: number;
  colors: ThemeColors;
  /** Defaults match fuel.tsx's tuning; finance.tsx passes its own (see git history for why they differ per-page). */
  keyboardBehavior?: KeyboardAvoidingViewProps["behavior"];
  keyboardVerticalOffset?: number;
}

/** Renders the current step of a useStepFlow wizard as a bottom-anchored modal. */
export default function StepFlowModal<K extends string>({
  step,
  isLastStep,
  draft,
  onChangeDraft,
  onCancel,
  onConfirm,
  webKeyboardInset,
  colors,
  keyboardBehavior = Platform.OS === "ios" ? "position" : "height",
  keyboardVerticalOffset = Platform.OS === "ios" ? 24 : 0,
}: StepFlowModalProps<K>) {
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
            <Text className="text-xl font-bold text-text">{step?.title}</Text>
            <Text className="text-sm leading-5 text-textMuted">{step?.hint}</Text>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              keyboardType={step?.keyboardType ?? "default"}
              autoCapitalize={step?.autoCapitalize ?? "sentences"}
              autoCorrect={step?.autoCorrect ?? true}
              className="rounded-md border border-border bg-surfaceSoft px-md py-3 text-base text-text"
              placeholder={step?.placeholder}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
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
