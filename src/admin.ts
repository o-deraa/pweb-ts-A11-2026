import { requireAdmin, logout, paintIdentity } from "./auth.js";
import {
  seedIfEmpty, getJenis, addJenis, toggleJenis, deleteJenis,
  getTiket, issueTiket, resetAntrian, countWaiting, getAuth,
  panggilBerikutnya, selesaikan, lewati,
} from "./storage.js";
import { PRIORITAS_LIST, Prioritas, JenisAntrian, Tiket, ownerName } from "./types.js";
import { toast, confirmAction } from "./ui.js";

const session = requireAdmin();
if (session) init();

function init(): void {
  seedIfEmpty();
  const session = getAuth();
  if (session) paintIdentity(session);
  (document.getElementById("logoutBtn") as HTMLButtonElement).addEventListener("click", logout);
  (document.getElementById("resetBtn") as HTMLButtonElement).addEventListener("click", async () => {
    const ok = await confirmAction({
      title: "Reset Antrian",
      message: "Seluruh tiket aktif akan dihapus dan penomoran kembali ke awal. Lanjutkan?",
      confirmText: "Ya, reset",
      danger: true,
    });
    if (ok) { resetAntrian(); renderAll(); toast("Antrian berhasil direset.", "success"); }
  });

  const addForm = document.getElementById("jenisForm") as HTMLFormElement;
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const kode = (document.getElementById("kode") as HTMLInputElement).value;
    const nama = (document.getElementById("nama") as HTMLInputElement).value;
    const r = addJenis(kode, nama);
    const err = document.getElementById("jenisError") as HTMLElement;
    err.textContent = r.ok ? "" : (r.error ?? "");
    if (r.ok) { addForm.reset(); renderAll(); toast("Jenis antrian ditambahkan.", "success"); }
  });

  const issueForm = document.getElementById("issueForm") as HTMLFormElement;
  issueForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const kode = (document.getElementById("issueKode") as HTMLSelectElement).value;
    const prioritas = (document.getElementById("issuePrioritas") as HTMLSelectElement).value as Prioritas;
    const nama = (document.getElementById("issueNama") as HTMLInputElement).value;
    const r = issueTiket(kode, prioritas, nama);
    const err = document.getElementById("issueError") as HTMLElement;
    err.textContent = r.ok ? "" : (r.error ?? "");
    if (r.ok && r.tiket) {
      (document.getElementById("issueNama") as HTMLInputElement).value = "";
      renderAll();
      toast(`Tiket ${r.tiket.nomor} untuk ${r.tiket.atasNama} diterbitkan.`, "success");
    }
  });

  renderAll();
}

function renderAll(): void {
  renderKpi();
  renderJenis();
  renderPrioritasOptions();
  renderKodeOptions();
  renderTikets();
}

function renderKpi(): void {
  const wrap = document.getElementById("kpiRow");
  if (!wrap) return;
  const jenis = getJenis();
  const tikets = getTiket();
  const stats: Array<[string, number]> = [
    ["Jenis antrian", jenis.length],
    ["Jenis aktif", jenis.filter((j) => j.aktif).length],
    ["Tiket menunggu", tikets.filter((t) => t.status === "Menunggu").length],
    ["Sedang dipanggil", tikets.filter((t) => t.status === "Dipanggil").length],
  ];
  wrap.innerHTML = stats.map(([label, value]) => `
    <div class="card kpi">
      <div class="v">${value}</div>
      <div class="l">${label}</div>
    </div>`).join("");
}

function renderJenis(): void {
  const wrap = document.getElementById("jenisList") as HTMLElement;
  const list = getJenis();
  wrap.innerHTML = list.map((j: JenisAntrian) => `
    <div class="list-row">
      <div class="row-main">
        <span class="badge soft">${j.kode}</span>
        <span><span class="nm">${j.nama}</span>
          <span class="muted sm"> &middot; ${countWaiting(j.kode)} menunggu</span>
          ${j.aktif ? "" : '<span class="pill normal">nonaktif</span>'}</span>
      </div>
      <div class="row-actions">
        <button class="btn btn-ghost sm" data-toggle="${j.kode}">${j.aktif ? "Nonaktifkan" : "Aktifkan"}</button>
        <button class="btn btn-danger sm" data-del="${j.kode}">Hapus</button>
      </div>
    </div>`).join("") || '<p class="empty-note">Belum ada jenis antrian. Tambahkan lewat form di atas.</p>';

  wrap.querySelectorAll<HTMLButtonElement>("[data-toggle]").forEach((b) =>
    b.addEventListener("click", () => { toggleJenis(b.dataset.toggle!); renderAll(); }));
  wrap.querySelectorAll<HTMLButtonElement>("[data-del]").forEach((b) =>
    b.addEventListener("click", async () => {
      const kode = b.dataset.del!;
      const ok = await confirmAction({
        title: "Hapus jenis antrian",
        message: `Jenis antrian ${kode} dan semua tiketnya akan dihapus. Tindakan ini tidak bisa dibatalkan.`,
        confirmText: "Hapus",
        danger: true,
      });
      if (ok) { deleteJenis(kode); renderAll(); toast(`Jenis antrian ${kode} dihapus.`, "success"); }
    }));
}

function renderPrioritasOptions(): void {
  const sel = document.getElementById("issuePrioritas") as HTMLSelectElement;
  sel.innerHTML = PRIORITAS_LIST.map((p) => `<option value="${p}">${p}</option>`).join("");
}

function renderKodeOptions(): void {
  const sel = document.getElementById("issueKode") as HTMLSelectElement;
  const aktif = getJenis().filter((j) => j.aktif);
  sel.innerHTML = '<option value="">Pilih jenis antrian</option>' +
    aktif.map((j) => `<option value="${j.kode}">${j.nama} (${j.kode})</option>`).join("");
}

function statusPill(t: Tiket): string {
  const cls = t.status.toLowerCase();
  return `<span class="pill ${cls}">${t.status}</span>`;
}

function renderTikets(): void {
  const wrap = document.getElementById("tiketList") as HTMLElement;
  const jenis = getJenis();
  const tikets = getTiket();
  const groups = jenis.map((j) => {
    const rows = tikets.filter((t) => t.kode === j.kode);
    if (rows.length === 0) return "";
    return `<h4 class="group-title">${j.nama}</h4>` + rows.map((t) => `
      <div class="list-row">
        <div class="row-main">
          <span class="nm">${t.nomor}</span>
          <span class="muted sm">atas nama ${ownerName(t)}</span>
          <span class="pill ${t.prioritas.toLowerCase()}">${t.prioritas}</span>
          ${statusPill(t)}
        </div>
        <div class="row-actions">
          ${t.status === "Menunggu" ? `<button class="btn btn-ghost sm" data-call="${t.kode}">Panggil</button>
             <button class="btn btn-ghost sm" data-skip="${t.id}">Lewati</button>` : ""}
          ${t.status === "Dipanggil" ? `<button class="btn btn-success sm" data-done="${t.kode}">Selesai</button>` : ""}
        </div>
      </div>`).join("");
  }).join("");
  wrap.innerHTML = groups || '<p class="empty-note">Belum ada tiket. Terbitkan tiket lewat form di atas atau dari halaman Ambil Nomor.</p>';

  wrap.querySelectorAll<HTMLButtonElement>("[data-call]").forEach((b) =>
    b.addEventListener("click", () => { panggilBerikutnya(b.dataset.call!); renderAll(); }));
  wrap.querySelectorAll<HTMLButtonElement>("[data-done]").forEach((b) =>
    b.addEventListener("click", () => { selesaikan(b.dataset.done!); renderAll(); }));
  wrap.querySelectorAll<HTMLButtonElement>("[data-skip]").forEach((b) =>
    b.addEventListener("click", () => { lewati(b.dataset.skip!); renderAll(); }));
}
