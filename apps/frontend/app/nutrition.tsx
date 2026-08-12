// THIS PAGE IS NOT CURRENTLY IN USE NOBODY TOUCH IT




// import { useMemo, useState } from "react";
// import {
//   ActivityIndicator,
//   Pressable,
//   StyleSheet,
//   Text,
//   TextInput,
//   View,
// } from "react-native";

// import { useThemeColors } from "../components/AppPreferences";
// import BottomNav from "../components/BottomNav";
// import { useBudget } from "../components/BudgetContext";
// import PageScaffold from "../components/PageScaffold";
// import { radii, shadows, spacing, type ThemeColors } from "../components/theme";

// const moneyFormat = new Intl.NumberFormat("en-US", {
//   style: "currency",
//   currency: "USD",
// });

// function todayIsoDate() {
//   return new Date().toISOString().slice(0, 10);
// }

// export default function Nutrition() {
//   const colors = useThemeColors();
//   const styles = useMemo(() => createStyles(colors), [colors]);
//   const { entries, prediction, loading, syncing, errorMessage, logEntry, removeEntry } =
//     useBudget();

//   const [entryDate, setEntryDate] = useState(todayIsoDate);
//   const [fuelCostInput, setFuelCostInput] = useState("");
//   const [foodCostInput, setFoodCostInput] = useState("");
//   const [milesDrivenInput, setMilesDrivenInput] = useState("");
//   const [mealsInput, setMealsInput] = useState("");
//   const [formMessage, setFormMessage] = useState("");

//   const handleLogEntry = async () => {
//     setFormMessage("");

//     try {
//       await logEntry({
//         entryDate,
//         fuelCost: parseOptionalNumber(fuelCostInput),
//         foodCost: parseOptionalNumber(foodCostInput),
//         milesDriven: parseOptionalNumber(milesDrivenInput),
//         meals: parseOptionalInt(mealsInput),
//       });

//       setFuelCostInput("");
//       setFoodCostInput("");
//       setMilesDrivenInput("");
//       setMealsInput("");
//       setEntryDate(todayIsoDate());
//       setFormMessage("Check-in logged.");
//     } catch {
//       // The budget context already surfaces errorMessage.
//     }
//   };

//   return (
//     // <PageScaffold
//     //   title="Nutrition"
//     //   subtitle="Log a quick daily check-in so ThinkTwice can separate essentials from discretionary spending."
//     //   footer={<BottomNav active="Nutrition" />}
//     // >
//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Forecast</Text>

//         {loading && !prediction ? (
//           <View style={styles.loadingRow}>
//             <ActivityIndicator color={colors.accent} size="small" />
//             <Text style={styles.cardText}>Loading your forecast...</Text>
//           </View>
//         ) : null}

//         {prediction && !prediction.available ? (
//           <Text style={styles.cardText}>{prediction.message}</Text>
//         ) : null}

//         {prediction && prediction.available ? (
//           <>
//             <Text style={styles.cardText}>
//               Projected fuel cost: {moneyFormat.format(prediction.prediction.predictedFuelCost)}
//             </Text>
//             <Text style={styles.cardText}>
//               Projected food cost: {moneyFormat.format(prediction.prediction.predictedFoodCost)}
//             </Text>
//             <Text style={styles.netText}>
//               Projected total: {moneyFormat.format(prediction.prediction.predictedTotal)}
//             </Text>
//             <Text style={styles.captionText}>
//               {prediction.prediction.method === "linear_regression"
//                 ? `Based on a trend across your last ${prediction.prediction.sampleSize} check-ins.`
//                 : `Based on the average of your last ${prediction.prediction.sampleSize} check-ins.`}
//             </Text>
//           </>
//         ) : null}
//       </View>

//       <View style={styles.inputCard}>
//         <Text style={styles.inputTitle}>Daily Check-In</Text>
//         <Text style={styles.inputSubtitle}>
//           A little each day beats a big catch-up later.
//         </Text>

//         <View style={styles.inputRow}>
//           <View style={styles.inputBlock}>
//             <Text style={styles.inputLabel}>Date</Text>
//             <TextInput
//               value={entryDate}
//               onChangeText={setEntryDate}
//               style={styles.input}
//               placeholder="YYYY-MM-DD"
//               placeholderTextColor={colors.textMuted}
//             />
//           </View>
//           <View style={styles.inputBlock}>
//             <Text style={styles.inputLabel}>Meals Out</Text>
//             <TextInput
//               value={mealsInput}
//               onChangeText={setMealsInput}
//               keyboardType="number-pad"
//               style={styles.input}
//               placeholder="0"
//               placeholderTextColor={colors.textMuted}
//             />
//           </View>
//         </View>

//         <View style={styles.inputRow}>
//           <View style={styles.inputBlock}>
//             <Text style={styles.inputLabel}>Fuel Cost ($)</Text>
//             <TextInput
//               value={fuelCostInput}
//               onChangeText={setFuelCostInput}
//               keyboardType="decimal-pad"
//               style={styles.input}
//               placeholder="0.00"
//               placeholderTextColor={colors.textMuted}
//             />
//           </View>
//           <View style={styles.inputBlock}>
//             <Text style={styles.inputLabel}>Food Cost ($)</Text>
//             <TextInput
//               value={foodCostInput}
//               onChangeText={setFoodCostInput}
//               keyboardType="decimal-pad"
//               style={styles.input}
//               placeholder="0.00"
//               placeholderTextColor={colors.textMuted}
//             />
//           </View>
//         </View>

//         <View style={styles.inputRow}>
//           <View style={styles.inputBlock}>
//             <Text style={styles.inputLabel}>Miles Driven</Text>
//             <TextInput
//               value={milesDrivenInput}
//               onChangeText={setMilesDrivenInput}
//               keyboardType="decimal-pad"
//               style={styles.input}
//               placeholder="0"
//               placeholderTextColor={colors.textMuted}
//             />
//           </View>
//         </View>

//         {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
//         {formMessage ? <Text style={styles.successText}>{formMessage}</Text> : null}

//         <Pressable
//           onPress={() => {
//             void handleLogEntry();
//           }}
//           disabled={syncing}
//           style={({ pressed }) => [styles.primaryButton, (pressed || syncing) && styles.buttonPressed]}
//         >
//           <Text style={styles.primaryButtonLabel}>{syncing ? "Saving..." : "Log Check-In"}</Text>
//         </Pressable>
//       </View>

//       <View style={styles.card}>
//         <Text style={styles.cardTitle}>Recent Check-Ins</Text>

//         {entries.length === 0 ? (
//           <Text style={styles.cardText}>
//             No check-ins yet. Log a few days to unlock a personalized forecast.
//           </Text>
//         ) : (
//           entries.slice(0, 7).map((entry) => (
//             <View key={entry.id} style={[styles.entryRow, shadows.soft]}>
//               <View style={styles.entryTextWrap}>
//                 <Text style={styles.entryDate}>{entry.entryDate}</Text>
//                 <Text style={styles.entryDetail}>
//                   {entry.fuelCost !== null ? `Fuel ${moneyFormat.format(entry.fuelCost)}` : "Fuel —"}
//                   {"  ·  "}
//                   {entry.foodCost !== null ? `Food ${moneyFormat.format(entry.foodCost)}` : "Food —"}
//                   {"  ·  "}
//                   {entry.meals !== null ? `${entry.meals} meals` : "— meals"}
//                 </Text>
//               </View>

//               <Pressable
//                 onPress={() => {
//                   void removeEntry(entry.id);
//                 }}
//                 style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}
//               >
//                 <Text style={styles.deleteButtonLabel}>Remove</Text>
//               </Pressable>
//             </View>
//           ))
//         )}
//       </View>
//     </PageScaffold>
//   );
// }

// const createStyles = (colors: ThemeColors) =>
//   StyleSheet.create({
//     card: {
//       backgroundColor: colors.surface,
//       borderRadius: radii.lg,
//       borderWidth: 1,
//       borderColor: colors.border,
//       padding: spacing.lg,
//       gap: spacing.sm,
//     },
//     cardTitle: {
//       color: colors.text,
//       fontSize: 20,
//       fontWeight: "700",
//     },
//     cardText: {
//       color: colors.textMuted,
//       fontSize: 15,
//       lineHeight: 21,
//     },
//     captionText: {
//       color: colors.textMuted,
//       fontSize: 13,
//       marginTop: 2,
//     },
//     netText: {
//       color: colors.accent,
//       fontSize: 16,
//       fontWeight: "700",
//       marginTop: spacing.xs,
//     },
//     loadingRow: {
//       flexDirection: "row",
//       alignItems: "center",
//       gap: spacing.xs,
//     },
//     inputCard: {
//       backgroundColor: colors.surface,
//       borderWidth: 1,
//       borderColor: colors.border,
//       borderRadius: radii.lg,
//       padding: spacing.md,
//       gap: spacing.sm,
//     },
//     inputTitle: {
//       color: colors.text,
//       fontSize: 20,
//       fontWeight: "700",
//     },
//     inputSubtitle: {
//       color: colors.textMuted,
//       fontSize: 14,
//     },
//     inputRow: {
//       flexDirection: "row",
//       gap: spacing.sm,
//     },
//     inputBlock: {
//       flex: 1,
//       gap: 6,
//     },
//     inputLabel: {
//       color: colors.textMuted,
//       fontSize: 13,
//       fontWeight: "600",
//     },
//     input: {
//       borderWidth: 1,
//       borderColor: colors.border,
//       borderRadius: radii.sm,
//       backgroundColor: colors.surfaceSoft,
//       color: colors.text,
//       paddingHorizontal: spacing.sm,
//       paddingVertical: 10,
//       fontSize: 16,
//     },
//     primaryButton: {
//       borderRadius: radii.md,
//       backgroundColor: colors.accent,
//       paddingVertical: 12,
//       alignItems: "center",
//     },
//     primaryButtonLabel: {
//       color: colors.accentDeep,
//       fontSize: 15,
//       fontWeight: "700",
//     },
//     errorText: {
//       color: colors.danger,
//       fontSize: 14,
//     },
//     successText: {
//       color: colors.success,
//       fontSize: 14,
//     },
//     buttonPressed: {
//       opacity: 0.85,
//     },
//     entryRow: {
//       flexDirection: "row",
//       alignItems: "center",
//       justifyContent: "space-between",
//       gap: spacing.sm,
//       backgroundColor: colors.surfaceSoft,
//       borderWidth: 1,
//       borderColor: colors.border,
//       borderRadius: radii.md,
//       padding: spacing.sm,
//     },
//     entryTextWrap: {
//       flex: 1,
//       gap: 2,
//     },
//     entryDate: {
//       color: colors.text,
//       fontSize: 14,
//       fontWeight: "700",
//     },
//     entryDetail: {
//       color: colors.textMuted,
//       fontSize: 13,
//     },
//     deleteButton: {
//       paddingVertical: 6,
//       paddingHorizontal: spacing.sm,
//       borderRadius: radii.sm,
//       borderWidth: 1,
//       borderColor: colors.danger,
//     },
//     deleteButtonLabel: {
//       color: colors.danger,
//       fontSize: 12,
//       fontWeight: "700",
//     },
//   });

// function parseOptionalNumber(value: string) {
//   const trimmedValue = value.trim();

//   if (!trimmedValue) {
//     return null;
//   }

//   const parsedValue = Number.parseFloat(trimmedValue);
//   return Number.isFinite(parsedValue) ? parsedValue : null;
// }

// function parseOptionalInt(value: string) {
//   const trimmedValue = value.trim();

//   if (!trimmedValue) {
//     return null;
//   }

//   const parsedValue = Number.parseInt(trimmedValue, 10);
//   return Number.isFinite(parsedValue) ? parsedValue : null;
// }
>>>>>>> b479907 (made ml learning less dramatic off smaller inputs)
