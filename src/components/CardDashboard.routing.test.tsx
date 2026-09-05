import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import CardDashboard from "./CardDashboard";

jest.mock(
  "react-router-dom",
  () =>
    jest.requireActual(
      "../../node_modules/react-router/dist/development/index.js"
    ),
  { virtual: true }
);

jest.mock("./MetricCard", () => ({
  __esModule: true,
  default: ({ title, onClick }: { title: string; onClick: () => void }) => (
    <button type="button" onClick={onClick}>
      {title}
    </button>
  ),
}));

jest.mock("./CalorieStepsRing", () => () => null);

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-path">{location.pathname}</span>;
}

test("opens metric details below the embedded health-app route", () => {
  const steps = [{ timestamp: "2026-09-04T08:00:00.000Z", value: 1234 }];

  render(
    <MemoryRouter initialEntries={["/web/solid-health-app"]}>
      <Routes>
        <Route
          path="/web/solid-health-app/*"
          element={
            <>
              <CardDashboard
                steps={steps}
                calories={[]}
                sleep={[]}
                heartRates={[]}
                allowed={{ steps: true }}
              />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Steps" }));

  expect(screen.getByTestId("location-path")).toHaveTextContent(
    "/web/solid-health-app/detail/steps"
  );
});
