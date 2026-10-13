import { seedIfEmpty, getJenisAktif, currentCalled, countWaiting, } from "./storage.js";
import { queueColor, ownerName } from "./types.js";
import { announceTicket } from "./audio.js";
import { getAuth } from "./storage.js";
import { paintIdentity, logout } from "./auth.js";
seedIfEmpty();
const viewer = getAuth();
const userBlock = document.getElementById("userBlock");
if (viewer) {
    paintIdentity(viewer);
    document.getElementById("logoutBtn").addEventListener("click", logout);
}
else if (userBlock) {
    userBlock.style.display = "none";
}
const fsBtn = document.getElementById("fsBtn");
const FS_ICONS = {
    enter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5"/><path d="M15 4h5v5"/><path d="M9 20H4v-5"/><path d="M15 20h5v-5"/></svg>`,
    exit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h5V4"/><path d="M20 9h-5V4"/><path d="M4 15h5v5"/><path d="M20 15h-5v5"/></svg>`,
};
function paintFullscreen() {
    const on = !!document.fullscreenElement;
    fsBtn.innerHTML = on ? FS_ICONS.exit : FS_ICONS.enter;
    fsBtn.setAttribute("aria-label", on ? "Keluar layar penuh" : "Layar penuh");
    fsBtn.setAttribute("aria-pressed", on ? "true" : "false");
}
paintFullscreen();
fsBtn.addEventListener("click", toggleFullscreen);
document.addEventListener("fullscreenchange", paintFullscreen);
function toggleFullscreen() {
    const action = document.fullscreenElement
        ? document.exitFullscreen()
        : document.documentElement.requestFullscreen();
    action.catch(() => { });
}
function pad(n) { return String(n).padStart(2, "0"); }
const lastCalled = {};
function render() {
    const grid = document.getElementById("layarGrid");
    const jenis = getJenisAktif();
    grid.innerHTML = jenis.map((j) => {
        const cur = currentCalled(j.kode);
        const waiting = countWaiting(j.kode);
        const color = queueColor(j.kode);
        const fresh = cur && lastCalled[j.kode] !== undefined && lastCalled[j.kode] !== cur.nomor;
        return `
    <div class="layar-panel${cur ? " called" : ""}${fresh ? " pulse" : ""}" style="--q:${color}">
      <div class="panel-head">
        <span class="panel-chip">${j.kode}</span>
        <span class="panel-name">${j.nama}</span>
        <span class="panel-count">${waiting} menunggu</span>
      </div>
      <div class="layar-body">
        ${cur
            ? `<div class="layar-lab">Dipanggil</div>
             <div class="layar-number">${cur.nomor}</div>
             <div class="layar-owner">atas nama ${ownerName(cur)}</div>`
            : `<div class="layar-idle">Belum ada antrean</div>`}
      </div>
    </div>`;
    }).join("") || '<p class="empty-note">Belum ada jenis antrian aktif.</p>';
    getJenisAktif().forEach((j) => {
        const c = currentCalled(j.kode);
        const nomor = c ? c.nomor : "";
        if (c && lastCalled[j.kode] !== undefined && lastCalled[j.kode] !== nomor) {
            announceTicket(c.nomor, j.kode);
        }
        lastCalled[j.kode] = nomor;
    });
    const now = new Date();
    document.getElementById("updatedAt").textContent =
        `${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
}
render();
window.setInterval(render, 2500);
//# sourceMappingURL=layar.js.map