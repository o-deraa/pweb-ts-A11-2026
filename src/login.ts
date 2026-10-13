import { login, redirectByRole } from "./auth.js";

const form = document.getElementById("loginForm") as HTMLFormElement;
const userEl = document.getElementById("username") as HTMLInputElement;
const passEl = document.getElementById("password") as HTMLInputElement;
const btn = document.getElementById("submitBtn") as HTMLButtonElement;
const errEl = document.getElementById("error") as HTMLElement;

function setLoading(on: boolean): void {
  btn.disabled = on;
  btn.textContent = on ? "Memverifikasi..." : "Masuk";
}
function showError(msg: string): void {
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
  } else {
    showError(result.error ?? "Login gagal.");
  }
});

document.querySelectorAll<HTMLButtonElement>(".demo-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    userEl.value = chip.dataset.user ?? "";
    passEl.value = chip.dataset.pass ?? "";
    showError("");
    userEl.focus();
  });
});
