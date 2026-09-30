import type { SessionOptions } from "iron-session";

// Edge-safe session configuration. Kept separate from session.ts because the middleware runs on
// the Edge runtime and must not pull in Prisma (which session.ts uses to re-validate the user).

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
