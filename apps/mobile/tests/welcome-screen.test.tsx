import { screen } from "@testing-library/react-native";

import WelcomeScreen from "../app/index";
import { renderScreen } from "./helpers/render";

describe("WelcomeScreen", () => {
  it("shows the app's name as the screen heading", async () => {
    await renderScreen(<WelcomeScreen />);
    expect(
      screen.getByRole("heading", { name: "ThinkTwice" }),
    ).toBeOnTheScreen();
  });

  it("shows the tagline", async () => {
    await renderScreen(<WelcomeScreen />);
    expect(
      screen.getByText(
        "Don't just track where your money went. See where it's taking you.",
      ),
    ).toBeOnTheScreen();
  });

  it("describes the logo for screen readers", async () => {
    await renderScreen(<WelcomeScreen />);
    expect(screen.getByLabelText("ThinkTwice logo")).toBeOnTheScreen();
  });
});
