import { cookies } from "next/headers";
import { getIronSession, type IronSession, type SessionOptions } from "iron-session";

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "USER";
};

export type AppSession = {
  user?: SessionUser;
};

const password = process.env.SESSION_SECRET;
if (!password || password.length < 32) {
  throw new Error(
    "SESSION_SECRET must be set and at least 32 characters long (see .env.example)"
  );
}

// Secure cookies require HTTPS. This app has no built-in TLS termination, so default to
// non-secure cookies and only opt in when explicitly running behind an HTTPS reverse proxy.
const cookieSecure = process.env.COOKIE_SECURE === "true";

export const sessionOptions: SessionOptions = {
  cookieName: "ithub_session",
  password,
  cookieOptions: {
    secure: cookieSecure,
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession(): Promise<IronSession<AppSession>> {
  return getIronSession<AppSession>(cookies(), sessionOptions);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user ?? null;
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
