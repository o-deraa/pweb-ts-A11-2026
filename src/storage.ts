import {
  LS, AuthSession, JenisAntrian, Tiket, Prioritas, PRIORITY_RANK,
} from "./types.js";

export const LS_AUDIO = "antrian.audio";

export function isAudioEnabled(): boolean {
  return localStorage.getItem(LS_AUDIO) !== 'false';
}

export function setAudioEnabled(enabled: boolean): void {
  localStorage.setItem(LS_AUDIO, enabled ? 'true' : 'false');
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}
function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getAuth(): AuthSession | null {
  return read<AuthSession | null>(LS.auth, null);
}
export function setAuth(a: AuthSession): void {
  write(LS.auth, a);
}
export function clearAuth(): void {
  localStorage.removeItem(LS.auth);
}

export function getJenis(): JenisAntrian[] {
  return read<JenisAntrian[]>(LS.jenis, []);
}
export function setJenis(list: JenisAntrian[]): void {
  write(LS.jenis, list);
}
export function getJenisAktif(): JenisAntrian[] {
  return getJenis().filter((j) => j.aktif);
}
export function findJenis(kode: string): JenisAntrian | undefined {
  return getJenis().find((j) => j.kode === kode);
}

export function addJenis(kode: string, nama: string): { ok: boolean; error?: string } {
  const k = kode.trim().toUpperCase();
  const n = nama.trim();
  if (!/^[A-Z]$/.test(k)) return { ok: false, error: "Kode harus 1 huruf kapital (A-Z)." };
  if (n.length === 0) return { ok: false, error: "Nama layanan wajib diisi." };
  const list = getJenis();
  if (list.some((j) => j.kode.toUpperCase() === k))
    return { ok: false, error: `Kode "${k}" sudah dipakai.` };
  if (list.some((j) => j.nama.toLowerCase() === n.toLowerCase()))
    return { ok: false, error: `Nama "${n}" sudah dipakai.` };
  list.push({ kode: k, nama: n, aktif: true });
  setJenis(list);
  return { ok: true };
}
export function toggleJenis(kode: string): void {
  const list = getJenis();
  const j = list.find((x) => x.kode === kode);
  if (j) { j.aktif = !j.aktif; setJenis(list); }
}
export function deleteJenis(kode: string): void {
  setJenis(getJenis().filter((j) => j.kode !== kode));
  setTiket(getTiket().filter((t) => t.kode !== kode));
}

export function getTiket(): Tiket[] {
  return read<Tiket[]>(LS.tiket, []);
}
export function setTiket(list: Tiket[]): void {
  write(LS.tiket, list);
}

function getCounters(): Record<string, number> {
  return read<Record<string, number>>(LS.counter, {});
}
function nextNumber(kode: string): number {
  const c = getCounters();
  c[kode] = (c[kode] ?? 0) + 1;
  write(LS.counter, c);
  return c[kode];
}

export function issueTiket(kode: string, prioritas: Prioritas, atasNama: string): { ok: boolean; tiket?: Tiket; error?: string } {
  const nama = (atasNama ?? "").trim();
  if (!nama) return { ok: false, error: "Atas nama wajib diisi." };
  const j = findJenis(kode);
  if (!j) return { ok: false, error: "Jenis antrian tidak ditemukan." };
  if (!j.aktif) return { ok: false, error: "Jenis antrian nonaktif." };
  const seq = nextNumber(kode);
  const tiket: Tiket = {
    id: `${kode}-${seq}-${Date.now()}`,
    nomor: `${kode}-${String(seq).padStart(3, "0")}`,
    kode,
    prioritas,
    status: "Menunggu",
    dibuatPada: Date.now(),
    atasNama: nama,
  };
  const list = getTiket();
  list.push(tiket);
  setTiket(list);
  return { ok: true, tiket };
}

export function resetAntrian(): void {
  setTiket([]);
  write(LS.counter, {});
}

export function waitingSorted(kode: string): Tiket[] {
  return getTiket()
    .filter((t) => t.kode === kode && t.status === "Menunggu")
    .sort((a, b) =>
      PRIORITY_RANK[b.prioritas] - PRIORITY_RANK[a.prioritas] ||
      a.dibuatPada - b.dibuatPada
    );
}
export function currentCalled(kode: string): Tiket | undefined {
  return getTiket().find((t) => t.kode === kode && t.status === "Dipanggil");
}
export function countWaiting(kode: string): number {
  return getTiket().filter((t) => t.kode === kode && t.status === "Menunggu").length;
}

function updateStatus(id: string, status: Tiket["status"]): void {
  const list = getTiket();
  const t = list.find((x) => x.id === id);
  if (t) { t.status = status; setTiket(list); }
}

export function panggilBerikutnya(kode: string): Tiket | undefined {
  const cur = currentCalled(kode);
  if (cur) updateStatus(cur.id, "Selesai");
  const next = waitingSorted(kode)[0];
  if (next) { updateStatus(next.id, "Dipanggil"); return next; }
  return undefined;
}
export function selesaikan(kode: string): void {
  const cur = currentCalled(kode);
  if (cur) updateStatus(cur.id, "Selesai");
}
export function lewati(id: string): void {
  const list = getTiket();
  const t = list.find((x) => x.id === id);
  if (t) {
    t.status = "Menunggu";
    t.dibuatPada = Date.now(); 
    setTiket(list);
  }
}

export function seedIfEmpty(): void {
  if (getJenis().length > 0) return;
  setJenis([
    { kode: "A", nama: "UMUM-1", aktif: true },
    { kode: "B", nama: "UMUM-2", aktif: true },
    { kode: "C", nama: "UMUM-3", aktif: true },
    { kode: "G", nama: "GIGI", aktif: true },
    { kode: "F", nama: "FARMASI", aktif: true },
    { kode: "P", nama: "PSIKOLOG", aktif: true },
  ]);
}
