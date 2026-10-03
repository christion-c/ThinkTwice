import type { User } from "firebase/auth";
import type { MoneyItem, MoneyItemInput, MoneyPlan, Paycheck, PaycheckInput, PayProfile } from "@thinktwice/shared-types";

import { getAuthHeader, requestBackend } from "./backend";

export type { MoneyItem, MoneyItemInput, MoneyPlan, Paycheck, PaycheckInput, PayProfile };

// Client for the backend's /money-plan routes - the user's pay profile
// and logged paychecks, plus their bills, debts, and assets. The server is the only copy:
// every change is saved immediately and the returned value replaces
// local state, so another device always sees the same plan.

export async function fetchMoneyPlan(user: User): Promise<MoneyPlan> {
  return requestBackend<MoneyPlan>("/money-plan", {
    method: "GET",
    headers: await getAuthHeader(user),
  });
}

export async function savePayProfile(user: User, pay: PayProfile): Promise<PayProfile> {
  const response = await requestBackend<{ pay: PayProfile }>("/money-plan/pay", {
    method: "PUT",
    headers: { ...(await getAuthHeader(user)), "Content-Type": "application/json" },
    body: JSON.stringify(pay),
  });

  return response.pay;
}

export async function createMoneyItem(user: User, input: MoneyItemInput): Promise<MoneyItem> {
  const response = await requestBackend<{ item: MoneyItem }>("/money-plan/items", {
    method: "POST",
    headers: { ...(await getAuthHeader(user)), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function replaceMoneyItem(user: User, itemId: string, input: MoneyItemInput): Promise<MoneyItem> {
  const response = await requestBackend<{ item: MoneyItem }>(`/money-plan/items/${itemId}`, {
    method: "PUT",
    headers: { ...(await getAuthHeader(user)), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return response.item;
}

export async function deleteMoneyItem(user: User, itemId: string): Promise<void> {
  await requestBackend<void>(`/money-plan/items/${itemId}`, {
    method: "DELETE",
    headers: await getAuthHeader(user),
  });
}

export async function createPaycheck(user: User, input: PaycheckInput): Promise<Paycheck> {
  const response = await requestBackend<{ paycheck: Paycheck }>("/money-plan/paychecks", {
    method: "POST",
    headers: { ...(await getAuthHeader(user)), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return response.paycheck;
}

export async function replacePaycheck(user: User, paycheckId: string, input: PaycheckInput): Promise<Paycheck> {
  const response = await requestBackend<{ paycheck: Paycheck }>(`/money-plan/paychecks/${paycheckId}`, {
    method: "PUT",
    headers: { ...(await getAuthHeader(user)), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  return response.paycheck;
}

export async function deletePaycheck(user: User, paycheckId: string): Promise<void> {
  await requestBackend<void>(`/money-plan/paychecks/${paycheckId}`, {
    method: "DELETE",
    headers: await getAuthHeader(user),
  });
}
