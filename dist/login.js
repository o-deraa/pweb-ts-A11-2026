import { login, redirectByRole } from "./auth.js";
const form = document.getElementById("loginForm");
const userEl = document.getElementById("username");
const passEl = document.getElementById("password");
const btn = document.getElementById("submitBtn");
const errEl = document.getElementById("error");
function setLoading(on) {
    btn.disabled = on;
    btn.textContent = on ? "Memverifikasi..." : "Masuk";
}
function showError(msg) {
    errEl.textContent = msg;
    errEl.style.display = msg ? "block" : "none";
}
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showError("");
    setLoading(true);
    const result = await login(userEl.value.trim(), passEl.value);
    setLoading(false);
    if (result.ok && result.session) {
        redirectByRole(result.session);
    }
    else {
        showError(result.error ?? "Login gagal.");
    }
});
document.querySelectorAll(".demo-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
        userEl.value = chip.dataset.user ?? "";
        passEl.value = chip.dataset.pass ?? "";
        showError("");
        userEl.focus();
    });
});
//# sourceMappingURL=login.js.map