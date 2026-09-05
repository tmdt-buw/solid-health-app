import React from "react";
import { MemoryRouter, useInRouterContext } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

/**
 * Reuse a host application's router when the embed is mounted below one.
 * Standalone embed consumers still receive a private in-memory router.
 */
export default function EmbeddedRouterBoundary({ children }: Props) {
  const hasHostRouter = useInRouterContext();

  if (hasHostRouter) {
    return <>{children}</>;
  }

  return <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;
}
