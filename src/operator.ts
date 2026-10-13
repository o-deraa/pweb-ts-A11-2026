import { requireAuth, logout, paintIdentity } from "./auth.js";
import {
  seedIfEmpty, getJenisAktif, currentCalled, waitingSorted, countWaiting,
  panggilBerikutnya, selesaikan, lewati,
} from "./storage.js";
import { JenisAntrian, queueColor, ownerName, AuthSession } from "./types.js";
import { announceTicket, soundEnabled, setSound } from "./audio.js";

const lastCalled: Record<string, string> = {};

const session = requireAuth();
if (session) init(session);

function init(session: AuthSession): void {
  seedIfEmpty();
  paintIdentity(session);
  (document.getElementById("logoutBtn") as HTMLButtonElement).addEventListener("click", logout);
  initSoundToggle();
  render();
  window.setInterval(render, 2500); 
}

function initSoundToggle(): void {
  const btn = document.getElementById("soundBtn") as HTMLButtonElement | null;
  if (!btn) return;
  const paint = () => { btn.textContent = soundEnabled() ? "Suara: ON" : "Suara: OFF"; };
  paint();
  btn.addEventListener("click", () => { setSound(!soundEnabled()); paint(); });
}

function render(): void {
  const grid = document.getElementById("opGrid") as HTMLElement;
  const jenis = getJenisAktif();
  grid.innerHTML = jenis.map((j: JenisAntrian) => {
    const cur = currentCalled(j.kode);
    const next = waitingSorted(j.kode)[0];
    const waiting = countWaiting(j.kode);
    const fresh = cur && lastCalled[j.kode] !== cur.nomor; 
    const color = queueColor(j.kode);
    return `
    <div class="card op-card" style="--q:${color}">
      <div class="op-top">
        <span class="badge">${j.kode}</span>
        <span class="nm">${j.nama}</span>
        <span class="cnt">${waiting} menunggu</span>
      </div>
      <div class="op-focal${cur ? " active" : ""}${fresh ? " pulse" : ""}">
        <div class="lab">${cur ? "Sedang dipanggil" : "Loket siap"}</div>
        <div class="num${cur ? "" : " idle"}">${cur ? cur.nomor : "Belum ada panggilan"}</div>
        ${cur ? `<div class="owner">atas nama ${ownerName(cur)}</div>` : ""}
      </div>
      <div class="op-next">
        <span class="lab">Berikutnya</span>
        ${next
          ? `<span class="nx-wrap"><span class="nx">${next.nomor}</span><span class="nx-name">atas nama ${ownerName(next)}</span></span><span class="pill ${next.prioritas.toLowerCase()}">${next.prioritas}</span>`
          : '<span class="nx muted">Tidak ada antrian</span>'}
      </div>
      <div class="op-actions">
        <button type="button" class="btn btn-primary" data-call="${j.kode}" ${next ? "" : "disabled"}>Panggil Berikutnya</button>
        <button type="button" class="btn btn-finish" data-done="${j.kode}" ${cur ? "" : "disabled"}>Selesai</button>
        <button type="button" class="btn btn-skip" data-skip="${cur ? cur.id : ""}" ${cur ? "" : "disabled"}>Lewati</button>
      </div>
    </div>`;
  }).join("") || '<p class="empty-note">Belum ada jenis antrian aktif.</p>';

  getJenisAktif().forEach((j) => {
    const c = currentCalled(j.kode);
    lastCalled[j.kode] = c ? c.nomor : "";
  });

  grid.querySelectorAll<HTMLButtonElement>("[data-call]").forEach((b) =>
    b.addEventListener("click", () => {
      const called = panggilBerikutnya(b.dataset.call!);
      if (called) {
        const jenis = getJenisAktif().find(j => j.kode === b.dataset.call);
        if (jenis) announceTicket(called.nomor, jenis.kode);
      }
      render();
    }));
  grid.querySelectorAll<HTMLButtonElement>("[data-done]").forEach((b) =>
    b.addEventListener("click", () => { selesaikan(b.dataset.done!); render(); }));
  grid.querySelectorAll<HTMLButtonElement>("[data-skip]").forEach((b) =>
    b.addEventListener("click", () => { if (b.dataset.skip) { lewati(b.dataset.skip); render(); } }));
}
