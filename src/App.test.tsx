import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginScreen from "./components/LoginScreen";
import SolidHealthAppEmbed from "./embed/SolidHealthAppEmbed";

jest.mock(
  "react-router-dom",
  () => ({
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    MemoryRouter: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Route: () => null,
  }),
  { virtual: true }
);

jest.mock("@react-oauth/google", () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useGoogleLogin: () => jest.fn(),
}));

describe("Solid Health standalone login", () => {
  test("uses the shared compact provider layout", () => {
    render(
      <LoginScreen
        onSolidLogin={jest.fn()}
        languageControl={<label>Language<select aria-label="Language"><option>English</option></select></label>}
      />
    );

    expect(screen.getByRole("heading", { name: "Solid Health App" })).toBeInTheDocument();
    expect(screen.getByText("Suggested providers")).toBeInTheDocument();
    const language = screen.getByLabelText("Language");
    const login = screen.getByRole("button", { name: /Login/i });
    expect(language).toBeInTheDocument();
    expect(login.closest("footer")?.firstElementChild).toContainElement(language);
    expect(login.closest("footer")?.lastElementChild).toBe(login);
    expect(screen.queryByText("No Solid Pod yet?")).not.toBeInTheDocument();
  });

  test("starts login with the selected TMDT provider", () => {
    const onSolidLogin = jest.fn();
    render(<LoginScreen onSolidLogin={onSolidLogin} />);

    fireEvent.click(screen.getByRole("button", { name: /Login/i }));

    expect(onSolidLogin).toHaveBeenCalledWith(
      "https://solid-community-server.tmdt.info"
    );
  });

  test("keeps standalone chrome out of the embed", async () => {
    const { container } = render(<SolidHealthAppEmbed />);

    await screen.findByText("Solid login is managed by Solid Dataspace");
    await waitFor(() => {
      expect(container.querySelector(".solid-health-header")).not.toBeInTheDocument();
      expect(container.querySelector(".solid-health-footer")).not.toBeInTheDocument();
      expect(container.querySelector(".language-select")).not.toBeInTheDocument();
    });
  });
});
