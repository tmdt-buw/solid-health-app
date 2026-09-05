import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import EmbeddedRouterBoundary from "./EmbeddedRouterBoundary";

jest.mock(
  "react-router-dom",
  () =>
    jest.requireActual(
      "../../node_modules/react-router/dist/development/index.js"
    ),
  { virtual: true }
);

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location-path">{location.pathname}</span>;
}

describe("EmbeddedRouterBoundary", () => {
  test("provides a router when the embed is rendered on its own", () => {
    render(
      <EmbeddedRouterBoundary>
        <LocationProbe />
      </EmbeddedRouterBoundary>
    );

    expect(screen.getByTestId("location-path")).toHaveTextContent("/");
  });

  test("reuses a host router and preserves its nested health route", () => {
    render(
      <MemoryRouter initialEntries={["/web/solid-health-app/detail/steps"]}>
        <EmbeddedRouterBoundary>
          <LocationProbe />
        </EmbeddedRouterBoundary>
      </MemoryRouter>
    );

    expect(screen.getByTestId("location-path")).toHaveTextContent(
      "/web/solid-health-app/detail/steps"
    );
  });
});
