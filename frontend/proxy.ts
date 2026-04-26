import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "streamcap-token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!isLoginPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
