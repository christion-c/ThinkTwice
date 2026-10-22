import { fireEvent, screen } from "@testing-library/react-native";
import { FirebaseError } from "firebase/app";

import { SignInScreen } from "../src/features/auth/sign-in-screen";
import { fakeAuth, renderWithAuth } from "./helpers/auth";

jest.mock("expo-router", () => ({ Link: "Text" }));

describe("SignInScreen", () => {
  it("has a heading and labeled fields", async () => {
    await renderWithAuth(<SignInScreen />);
    expect(
      screen.getByRole("heading", { name: "Welcome back" }),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText("Email")).toBeOnTheScreen();
    expect(screen.getByLabelText("Password")).toBeOnTheScreen();
  });

  it("offers Google sign-in as well", async () => {
    await renderWithAuth(<SignInScreen />);
    expect(
      screen.getByRole("button", { name: "Continue with Google" }),
    ).toBeOnTheScreen();
  });

  it("explains what's missing instead of signing in with empty fields", async () => {
    const auth = fakeAuth();
    await renderWithAuth(<SignInScreen />, auth);
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText("Enter your email address."),
    ).toBeOnTheScreen();
    expect(screen.getByText("Enter your password.")).toBeOnTheScreen();
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it("signs in with the trimmed email and the exact password", async () => {
    const auth = fakeAuth();
    await renderWithAuth(<SignInScreen />, auth);
    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "  alex@example.com ",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Password"),
      " pass word ",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(auth.signIn).toHaveBeenCalledWith("alex@example.com", " pass word ");
  });

  it("shows a friendly message when the password doesn't match", async () => {
    const auth = fakeAuth({
      signIn: jest.fn(() =>
        Promise.reject(
          new FirebaseError("auth/invalid-credential", "Firebase: Error"),
        ),
      ),
    });
    await renderWithAuth(<SignInScreen />, auth);
    await fireEvent.changeText(
      screen.getByLabelText("Email"),
      "alex@example.com",
    );
    await fireEvent.changeText(screen.getByLabelText("Password"), "wrong");
    await fireEvent.press(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByText(
        "That email and password don't match. Try again, or reset your password.",
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/Firebase/)).toBeNull();
  });
});
