import { useMemo } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from "react-native";
import type { KeyboardAvoidingViewProps } from "react-native";

import type { StepFlowStepConfig } from "../hooks/useStepFlow";
import { createStepFlowStyles } from "./step-flow-styles";
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
  const styles = useMemo(() => createStepFlowStyles(colors), [colors]);

  return (
    <Modal transparent visible={Boolean(step)} animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={keyboardBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
        style={styles.modalBackdrop}
      >
        <View style={[styles.modalContainer, { marginBottom: webKeyboardInset }]}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{step?.title}</Text>
            <Text style={styles.modalHint}>{step?.hint}</Text>
            <TextInput
              value={draft}
              onChangeText={onChangeDraft}
              keyboardType={step?.keyboardType ?? "default"}
              autoCapitalize={step?.autoCapitalize ?? "sentences"}
              autoCorrect={step?.autoCorrect ?? true}
              style={styles.modalInput}
              placeholder={step?.placeholder}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={onCancel} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryLabel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onConfirm} style={styles.modalPrimaryButton}>
                <Text style={styles.modalPrimaryLabel}>{isLastStep ? "Done" : "Next"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
