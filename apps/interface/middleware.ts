import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./src/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return;
  }

  const response = intlMiddleware(request);

  if (pathname.startsWith("/campaigns/")) {
    response.headers.set("Surrogate-Key", "campaigns");
  }

  if (pathname.startsWith("/embed/")) {
    response.headers.set("Surrogate-Key", "embed");
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
