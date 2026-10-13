import { LS, PRIORITY_RANK, } from "./types.js";
export const LS_AUDIO = "antrian.audio";
export function isAudioEnabled() {
    return localStorage.getItem(LS_AUDIO) !== 'false';
}
export function setAudioEnabled(enabled) {
    localStorage.setItem(LS_AUDIO, enabled ? 'true' : 'false');
}
function read(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
export function getAuth() {
    return read(LS.auth, null);
}
export function setAuth(a) {
    write(LS.auth, a);
}
export function clearAuth() {
    localStorage.removeItem(LS.auth);
}
export function getJenis() {
    return read(LS.jenis, []);
}
export function setJenis(list) {
    write(LS.jenis, list);
}
export function getJenisAktif() {
    return getJenis().filter((j) => j.aktif);
}
export function findJenis(kode) {
    return getJenis().find((j) => j.kode === kode);
}
export function addJenis(kode, nama) {
    const k = kode.trim().toUpperCase();
    const n = nama.trim();
    if (!/^[A-Z]$/.test(k))
        return { ok: false, error: "Kode harus 1 huruf kapital (A-Z)." };
    if (n.length === 0)
        return { ok: false, error: "Nama layanan wajib diisi." };
    const list = getJenis();
    if (list.some((j) => j.kode.toUpperCase() === k))
        return { ok: false, error: `Kode "${k}" sudah dipakai.` };
    if (list.some((j) => j.nama.toLowerCase() === n.toLowerCase()))
        return { ok: false, error: `Nama "${n}" sudah dipakai.` };
    list.push({ kode: k, nama: n, aktif: true });
    setJenis(list);
    return { ok: true };
}
export function toggleJenis(kode) {
    const list = getJenis();
    const j = list.find((x) => x.kode === kode);
    if (j) {
        j.aktif = !j.aktif;
        setJenis(list);
    }
}
export function deleteJenis(kode) {
    setJenis(getJenis().filter((j) => j.kode !== kode));
    setTiket(getTiket().filter((t) => t.kode !== kode));
}
export function getTiket() {
    return read(LS.tiket, []);
}
export function setTiket(list) {
    write(LS.tiket, list);
}
function getCounters() {
    return read(LS.counter, {});
}
function nextNumber(kode) {
    const c = getCounters();
    c[kode] = (c[kode] ?? 0) + 1;
    write(LS.counter, c);
    return c[kode];
}
export function issueTiket(kode, prioritas, atasNama) {
    const nama = (atasNama ?? "").trim();
    if (!nama)
        return { ok: false, error: "Atas nama wajib diisi." };
    const j = findJenis(kode);
    if (!j)
        return { ok: false, error: "Jenis antrian tidak ditemukan." };
    if (!j.aktif)
        return { ok: false, error: "Jenis antrian nonaktif." };
    const seq = nextNumber(kode);
    const tiket = {
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
export function resetAntrian() {
    setTiket([]);
    write(LS.counter, {});
}
export function waitingSorted(kode) {
    return getTiket()
        .filter((t) => t.kode === kode && t.status === "Menunggu")
        .sort((a, b) => PRIORITY_RANK[b.prioritas] - PRIORITY_RANK[a.prioritas] ||
        a.dibuatPada - b.dibuatPada);
}
export function currentCalled(kode) {
    return getTiket().find((t) => t.kode === kode && t.status === "Dipanggil");
}
export function countWaiting(kode) {
    return getTiket().filter((t) => t.kode === kode && t.status === "Menunggu").length;
}
function updateStatus(id, status) {
    const list = getTiket();
    const t = list.find((x) => x.id === id);
    if (t) {
        t.status = status;
        setTiket(list);
    }
}
export function panggilBerikutnya(kode) {
    const cur = currentCalled(kode);
    if (cur)
        updateStatus(cur.id, "Selesai");
    const next = waitingSorted(kode)[0];
    if (next) {
        updateStatus(next.id, "Dipanggil");
        return next;
    }
    return undefined;
}
export function selesaikan(kode) {
    const cur = currentCalled(kode);
    if (cur)
        updateStatus(cur.id, "Selesai");
}
export function lewati(id) {
    const list = getTiket();
    const t = list.find((x) => x.id === id);
    if (t) {
        t.status = "Menunggu";
        t.dibuatPada = Date.now();
        setTiket(list);
    }
}
export function seedIfEmpty() {
    if (getJenis().length > 0)
        return;
    setJenis([
        { kode: "A", nama: "UMUM-1", aktif: true },
        { kode: "B", nama: "UMUM-2", aktif: true },
        { kode: "C", nama: "UMUM-3", aktif: true },
        { kode: "G", nama: "GIGI", aktif: true },
        { kode: "F", nama: "FARMASI", aktif: true },
        { kode: "P", nama: "PSIKOLOG", aktif: true },
    ]);
}
//# sourceMappingURL=storage.js.map