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
import type { VehicleFlowStep } from "../../hooks/useVehicleFormFlow";
import type { createFuelStyles } from "./fuel.styles";

const TITLES: Record<VehicleFlowStep, string> = {
  nickname: "Nickname",
  year: "Year",
  make: "Make",
  model: "Model",
  mpg: "MPG",
  tank: "Tank size",
};

const HINTS: Record<VehicleFlowStep, string> = {
  nickname: "Enter a nickname for this vehicle.",
  year: "Enter the model year.",
  make: "Enter the make.",
  model: "Enter the model.",
  mpg: "Enter the vehicle’s average MPG.",
  tank: "Enter the tank size in gallons.",
};

const PLACEHOLDERS: Record<VehicleFlowStep, string> = {
  nickname: "eg. My daily driver",
  year: "eg. 2016",
  make: "eg. Toyota, Ford, Nissan",
  model: "Model Name",
  mpg: "0",
  tank: "0",
};

type Props = {
  vehicleFlowStep: VehicleFlowStep | null;
  fieldDraft: string;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  colors: ThemeColors;
  styles: ReturnType<typeof createFuelStyles>;
};

export default function VehicleFormModal({
  vehicleFlowStep,
  fieldDraft,
  onChangeDraft,
  onClose,
  onSave,
  colors,
  styles,
}: Props) {
  return (
    <Modal
      transparent
      visible={Boolean(vehicleFlowStep)}
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{vehicleFlowStep ? TITLES[vehicleFlowStep] : ""}</Text>
            <Text style={styles.modalHint}>{vehicleFlowStep ? HINTS[vehicleFlowStep] : ""}</Text>
            <TextInput
              value={fieldDraft}
              onChangeText={onChangeDraft}
              keyboardType={vehicleFlowStep === "year" ? "number-pad" : "decimal-pad"}
              style={styles.modalInput}
              placeholder={vehicleFlowStep ? PLACEHOLDERS[vehicleFlowStep] : "0"}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable onPress={onClose} style={styles.modalSecondaryButton}>
                <Text style={styles.modalSecondaryLabel}>Cancel</Text>
              </Pressable>
              <Pressable onPress={onSave} style={styles.modalPrimaryButton}>
                <Text style={styles.modalPrimaryLabel}>{vehicleFlowStep === "tank" ? "Done" : "Next"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
