import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type AppSession } from "@/lib/sessionConfig";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<AppSession>(request, response, sessionOptions);

  if (!session.user) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role checks deliberately do NOT happen here: the cookie's copy of the role can be stale (the
  // user may have been demoted, promoted or deleted since logging in). Admin pages re-check via
  // src/app/admin/layout.tsx and every API handler via guardApi(), both against the database.

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
