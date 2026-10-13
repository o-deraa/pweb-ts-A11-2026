export const PRIORITY_RANK = {
    VIP: 4,
    Disabilitas: 3,
    Lansia: 2,
    Normal: 1,
};
export const PRIORITAS_LIST = ["Normal", "Lansia", "Disabilitas", "VIP"];
export const QUEUE_COLORS = {
    A: "#1E40AF", B: "#166534", C: "#155E75",
    G: "#9A3412", F: "#9D174D", P: "#5B21B6",
};
export function queueColor(kode) {
    return QUEUE_COLORS[kode.toUpperCase()] ?? "#046C4E";
}
export function ownerName(t) {
    return (t.atasNama || "").trim() || "Tamu";
}
export const LS = {
    auth: "antrian.auth",
    jenis: "antrian.jenisAntrian",
    tiket: "antrian.tiket",
    counter: "antrian.counter",
};
//# sourceMappingURL=types.js.map