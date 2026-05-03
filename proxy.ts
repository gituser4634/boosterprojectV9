import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const boosterRoutes = [
  "/booster-profile",
  "/booster-requests",
  "/booster-payments",
  "/booster-chats",
  "/booster-dashboard",
];

const clientRoutes = [
  "/client-settings",
  "/client-orders",
];

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;
  const { pathname } = req.nextUrl;

  const isBoosterRoute = boosterRoutes.some((route) => pathname.startsWith(route));
  const isClientRoute = clientRoutes.some((route) => pathname.startsWith(route));

  // If the route is protected and the user is not logged in, redirect to "/level-up"
  if ((isBoosterRoute || isClientRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/level-up", req.nextUrl));
  }

  // If a logged-in user with CLIENT role tries to access a Booster route
  if (isBoosterRoute && role === "CLIENT") {
    return NextResponse.redirect(new URL("/booster-browse", req.nextUrl));
  }

  // If a logged-in user with BOOSTER role tries to access a Client route
  if (isClientRoute && role === "BOOSTER") {
    return NextResponse.redirect(new URL("/booster-dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// Optionally, configure matcher to optimize
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
