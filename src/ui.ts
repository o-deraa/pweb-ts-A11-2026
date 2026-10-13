
type ToastType = "success" | "danger" | "info";

let toastEl: HTMLElement | null = null;
let toastTimer = 0;

function ensureToast(): HTMLElement {
  if (toastEl) return toastEl;
  const el = document.createElement("div");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.setAttribute("aria-live", "polite");
  document.body.appendChild(el);
  toastEl = el;
  return el;
}

export function toast(message: string, type: ToastType = "info", ms = 3500): void {
  const el = ensureToast();
  el.className = `toast ${type} show`;
  el.textContent = message;
  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { el.className = `toast ${type}`; }, ms);
}

interface ConfirmOpts {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function confirmAction(opts: ConfirmOpts): Promise<boolean> {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <h3 id="modalTitle">${opts.title}</h3>
        <p>${opts.message}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-act="cancel">${opts.cancelText ?? "Batal"}</button>
          <button class="btn ${opts.danger ? "btn-danger" : "btn-primary"}" data-act="ok">${opts.confirmText ?? "Ya"}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const okBtn = overlay.querySelector<HTMLButtonElement>('[data-act="ok"]')!;
    const cancelBtn = overlay.querySelector<HTMLButtonElement>('[data-act="cancel"]')!;
    const prevFocus = document.activeElement as HTMLElement | null;

    function close(result: boolean): void {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      if (prevFocus) prevFocus.focus();
      resolve(result);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") close(false);
      if (e.key === "Tab") {
        e.preventDefault();
        (document.activeElement === okBtn ? cancelBtn : okBtn).focus();
      }
    }

    okBtn.addEventListener("click", () => close(true));
    cancelBtn.addEventListener("click", () => close(false));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(false); });
    document.addEventListener("keydown", onKey);
    requestAnimationFrame(() => { overlay.classList.add("show"); okBtn.focus(); });
  });
}
