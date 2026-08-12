import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

import type { ThemeColors } from "../theme";
import type { FuelFlowStep } from "../../hooks/useFuelCheckInFlow";
import type { createFuelStyles } from "./fuel.styles";

const TITLES: Record<FuelFlowStep, string> = {
  gallons: "Gallons",
  price: "Price per gallon",
  miles: "Miles since last fill-up",
  tankLevel: "Tank level",
};

const HINTS: Record<FuelFlowStep, string> = {
  gallons: "Enter the gallons you put in your tank this fill-up.",
  price: "Enter the price you paid per gallon.",
  miles: "Enter the miles you drove since your previous fill-up.",
  tankLevel: "Enter how full the tank is right now.",
};

const PLACEHOLDERS: Record<FuelFlowStep, string> = {
  gallons: "0",
  price: "0.00",
  miles: "0",
  tankLevel: "0%",
};

type Props = {
  flowStep: FuelFlowStep | null;
  fieldDraft: string;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createFuelStyles>;
};

export default function FuelCheckInModal({
  flowStep,
  fieldDraft,
  onChangeDraft,
  onClose,
  onSave,
  colors,
  styles,
}: Props) {
  return (
    <Modal transparent visible={Boolean(flowStep)} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{flowStep ? TITLES[flowStep] : ""}</Text>
            <Text style={styles.modalHint}>{flowStep ? HINTS[flowStep] : ""}</Text>
            <TextInput
              value={fieldDraft}
              onChangeText={onChangeDraft}
              keyboardType="decimal-pad"
              style={styles.modalInput}
              placeholder={flowStep ? PLACEHOLDERS[flowStep] : "0"}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={onClose} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryLabel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onSave} style={styles.modalPrimaryButton}>
                <Text style={styles.modalPrimaryLabel}>{flowStep === "tankLevel" ? "Done" : "Next"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
