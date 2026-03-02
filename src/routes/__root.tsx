import {
  createRootRoute,
  Outlet,
  ScrollRestoration,
} from "@tanstack/react-router";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}
