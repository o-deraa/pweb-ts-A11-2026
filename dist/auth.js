import { LS } from "./types.js";
import { getAuth, setAuth, clearAuth } from "./storage.js";
const DUMMY_LOGIN = "https://dummyjson.com/auth/login";
const DUMMY_ME = "https://dummyjson.com/auth/me";
async function fetchRole(token) {
    try {
        const res = await fetch(DUMMY_ME, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok)
            return "user";
        const me = await res.json();
        return me.role ?? "user";
    }
    catch {
        return "user";
    }
}
export function isAdminLike(role) {
    return role === "admin" || role === "moderator";
}
export async function login(username, password) {
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
        const token = data.accessToken ?? data.token ?? "";
        if (!token)
            return { ok: false, error: "Respons server tidak berisi token." };
        const role = await fetchRole(token);
        const session = {
            token,
            role,
            firstName: data.firstName ?? username,
            username: data.username ?? username,
        };
        setAuth(session);
        return { ok: true, session };
    }
    catch {
        return { ok: false, error: "Koneksi jaringan gagal. Coba lagi." };
    }
}
export function logout() {
    clearAuth();
    window.location.href = "login.html";
}
export function requireAuth() {
    const a = getAuth();
    if (!a || !a.token) {
        window.location.href = "login.html";
        return null;
    }
    return a;
}
export function paintIdentity(a) {
    const name = (a.firstName || a.username || "").trim();
    const set = (id, value) => {
        const el = document.getElementById(id);
        if (el)
            el.textContent = value;
    };
    set("userInitial", (name.charAt(0) || "?").toUpperCase());
    set("userName", name);
    set("userRole", a.role);
}
export function requireAdmin() {
    const a = requireAuth();
    if (!a)
        return null;
    if (!isAdminLike(a.role)) {
        window.location.href = "login.html";
        return null;
    }
    return a;
}
const SAFE_NEXT = ["ambil-antrian.html", "operator.html", "layar.html", "index.html"];
export function redirectByRole(session) {
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && SAFE_NEXT.includes(next)) {
        window.location.href = next;
        return;
    }
    window.location.href = isAdminLike(session.role) ? "index.html" : "ambil-antrian.html";
}
export function requireVisitor(returnTo) {
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
//# sourceMappingURL=auth.js.map