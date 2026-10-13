import { LS, AuthSession, Role } from "./types.js";
import { getAuth, setAuth, clearAuth } from "./storage.js";

const DUMMY_LOGIN = "https://dummyjson.com/auth/login";
const DUMMY_ME = "https://dummyjson.com/auth/me";

async function fetchRole(token: string): Promise<Role> {
  try {
    const res = await fetch(DUMMY_ME, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return "user";
    const me = await res.json();
    return (me.role as Role) ?? "user";
  } catch {
    return "user";
  }
}

interface LoginResult { ok: boolean; session?: AuthSession; error?: string; }

export function isAdminLike(role: Role): boolean {
  return role === "admin" || role === "moderator";
}

export async function login(username: string, password: string): Promise<LoginResult> {
  try {
    const res = await fetch(DUMMY_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      return { ok: false, error: res.status === 400 ? "Username atau password salah." : `Gagal login (HTTP ${res.status}).` };
    }
    const data = await res.json();
    const token: string = data.accessToken ?? data.token ?? "";
    if (!token) return { ok: false, error: "Respons server tidak berisi token." };
    const role = await fetchRole(token);
    const session: AuthSession = {
      token,
      role,
      firstName: data.firstName ?? username,
      username: data.username ?? username,
    };
    setAuth(session);
    return { ok: true, session };
  } catch {
    return { ok: false, error: "Koneksi jaringan gagal. Coba lagi." };
  }
}

export function logout(): void {
  clearAuth();
  window.location.href = "login.html";
}

export function requireAuth(): AuthSession | null {
  const a = getAuth();
  if (!a || !a.token) { window.location.href = "login.html"; return null; }
  return a;
}

export function paintIdentity  (a: AuthSession): void {
  const name = (a.firstName || a.username || "").trim();
  const set = (id: string, value: string): void => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };
  set("userInitial", (name.charAt(0) || "?").toUpperCase());
  set("userName", name);
  set("userRole", a.role);
}

export function requireAdmin(): AuthSession | null {
  const a = requireAuth();
  if (!a) return null;
  if (!isAdminLike(a.role)) { window.location.href = "login.html"; return null; }
  return a;
}

const SAFE_NEXT = ["ambil-antrian.html", "operator.html", "layar.html", "index.html"];

export function redirectByRole(session: AuthSession): void {
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && SAFE_NEXT.includes(next)) { window.location.href = next; return; }
  window.location.href = isAdminLike(session.role) ? "index.html" : "ambil-antrian.html";
}

export function requireVisitor(returnTo: string): AuthSession | null {
  const a = getAuth();
  if (!a || !a.token) {
    window.location.replace(`login.html?next=${encodeURIComponent(returnTo)}`);
    return null;
  }
  if (isAdminLike(a.role)) {
    window.location.replace("index.html");
    return null;
  }
  return a;
}

export { LS };
