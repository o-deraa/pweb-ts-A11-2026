import {
  seedIfEmpty, getJenisAktif, issueTiket, countWaiting,
} from "./storage.js";
import { JenisAntrian, Prioritas, PRIORITAS_LIST, queueColor, AuthSession } from "./types.js";
import { requireVisitor, logout, paintIdentity } from "./auth.js";
import { toast } from "./ui.js";

const overlay = document.getElementById("ticketOverlay") as HTMLElement | null;
const ovNum = document.getElementById("ovNum") as HTMLElement | null;
const ovName = document.getElementById("ovName") as HTMLElement | null;
const ovPrio = document.getElementById("ovPrio") as HTMLElement | null;
let overlayTimer = 0;

let owner = "";

function hideTicket(): void {
  if (overlayTimer) { window.clearTimeout(overlayTimer); overlayTimer = 0; }
  overlay?.classList.remove("show");
}
function showTicket(nomor: string, prioritas: Prioritas, warna: string): void {
  if (!overlay || !ovNum || !ovPrio) return;
  overlay.style.setProperty("--q", warna); 
  ovNum.textContent = nomor;
  if (ovName) ovName.textContent = `atas nama ${owner}`;
  ovPrio.textContent = prioritas;
  overlay.classList.add("show");
  if (overlayTimer) window.clearTimeout(overlayTimer);
  overlayTimer = window.setTimeout(hideTicket, 5000);
}
overlay?.addEventListener("click", hideTicket);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideTicket(); });

function pad(n: number): string { return String(n).padStart(2, "0"); }

const PRIO_ICON: Record<Prioritas, string> = {
  Normal: "assets/icons8-standing-man-48.png",
  Lansia: "assets/icons8-elderly-person-48.png",
  Disabilitas: "assets/icons8-disabled-64.png",
  VIP: "assets/icons8-crown-48.png",
};

const selectedPrio: Record<string, Prioritas> = {};
function prioOf(kode: string): Prioritas { return selectedPrio[kode] ?? "Normal"; }

let lastSignature = "";
function signatureOf(list: JenisAntrian[]): string {
  return list.map((j) => `${j.kode}:${j.nama}`).join("|");
}

function tileMarkup(j: JenisAntrian): string {
  return PRIORITAS_LIST.map((p) => {
    const on = prioOf(j.kode) === p;
    return `<button type="button" class="ambil-tile${on ? " active" : ""}" data-kode="${j.kode}" data-prio="${p}" aria-pressed="${on}"><span class="tile-ico"><img src="${PRIO_ICON[p]}" alt="" width="32" height="32" /></span><span>${p}</span></button>`;
  }).join("");
}

function cardMarkup(j: JenisAntrian): string {
  return `
    <div class="card ambil-card" data-kode="${j.kode}" style="--q:${queueColor(j.kode)}">
      <div class="ambil-head panel-head">
        <span class="panel-chip">${j.kode}</span>
        <span class="panel-name">${j.nama}</span>
        <span class="panel-count">${countWaiting(j.kode)} menunggu</span>
      </div>
      <div class="ambil-body">
        <div class="ambil-seglabel">Prioritas</div>
        <div class="ambil-tiles" role="group" aria-label="Tingkat prioritas ${j.nama}" data-kode="${j.kode}">${tileMarkup(j)}</div>
        <button type="button" class="btn btn-primary block ambil-take" data-take="${j.kode}">Ambil Nomor</button>
      </div>
    </div>`;
}

function buildGrid(grid: HTMLElement, jenis: JenisAntrian[]): void {
  grid.innerHTML = jenis.map(cardMarkup).join("") ||
    '<p class="empty-note">Belum ada jenis antrian aktif. Tambahkan dari Dashboard Admin.</p>';

  grid.querySelectorAll<HTMLElement>(".ambil-tiles").forEach((seg) => {
    const kode = seg.dataset.kode ?? "";
    seg.querySelectorAll<HTMLButtonElement>(".ambil-tile").forEach((b) =>
      b.addEventListener("click", () => {
        selectedPrio[kode] = (b.dataset.prio as Prioritas) ?? "Normal";
        seg.querySelectorAll(".ambil-tile").forEach((x) => {
          const on = x === b;
          x.classList.toggle("active", on);
          x.setAttribute("aria-pressed", on ? "true" : "false");
        });
      }));
  });

  grid.querySelectorAll<HTMLButtonElement>("[data-take]").forEach((b) =>
    b.addEventListener("click", () => take(b.dataset.take!, prioOf(b.dataset.take!))));
}

function refreshCounts(grid: HTMLElement, jenis: JenisAntrian[]): void {
  jenis.forEach((j) => {
    const el = grid.querySelector<HTMLElement>(`.ambil-card[data-kode="${j.kode}"] .panel-count`);
    if (el) el.textContent = `${countWaiting(j.kode)} menunggu`;
  });
}

function render(): void {
  const grid = document.getElementById("ambilGrid") as HTMLElement;
  const jenis = getJenisAktif();
  const sig = signatureOf(jenis);

  if (sig !== lastSignature) {
    lastSignature = sig;
    Object.keys(selectedPrio).forEach((k) => {
      if (!jenis.some((j) => j.kode === k)) delete selectedPrio[k];
    });
    buildGrid(grid, jenis);   
  } else {
    refreshCounts(grid, jenis); 
  }

  const now = new Date();
  (document.getElementById("ambilData") as HTMLElement).textContent =
    `Jenis antrian baru muncul otomatis. Data ${pad(now.getHours())}.${pad(now.getMinutes())}.${pad(now.getSeconds())}`;
}

function take(kode: string, prioritas: Prioritas): void {
  const r = issueTiket(kode, prioritas, owner);
  if (r.ok && r.tiket) {
    showTicket(r.tiket.nomor, r.tiket.prioritas, queueColor(kode));
    render(); 
  } else {
    toast(r.error ?? "Gagal mengambil nomor.", "danger");
  }
}

function init(session: AuthSession): void {
  seedIfEmpty();
  owner = (session.firstName || session.username || "").trim();
  paintIdentity(session);
  (document.getElementById("logoutBtn") as HTMLButtonElement).addEventListener("click", logout);

  render();
  window.setInterval(render, 2500); 
}

const session = requireVisitor("ambil-antrian.html");
if (session) init(session);
