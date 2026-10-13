
export type Role = "admin" | "moderator" | "user";

export type Prioritas = "Normal" | "Lansia" | "Disabilitas" | "VIP";
export type StatusTiket = "Menunggu" | "Dipanggil" | "Selesai" | "Dilewati";

export interface AuthSession {
  token: string;
  role: Role;
  firstName: string;
  username: string;
}

export interface JenisAntrian {
  kode: string;   
  nama: string;   
  aktif: boolean;
}

export interface Tiket {
  id: string;         
  nomor: string;      
  kode: string;       
  prioritas: Prioritas;
  status: StatusTiket;
  dibuatPada: number;  
  atasNama: string;    
}

export const PRIORITY_RANK: Record<Prioritas, number> = {
  VIP: 4,
  Disabilitas: 3,
  Lansia: 2,
  Normal: 1,
};

export const PRIORITAS_LIST: Prioritas[] = ["Normal", "Lansia", "Disabilitas", "VIP"];

export const QUEUE_COLORS: Record<string, string> = {
  A: "#1E40AF", B: "#166534", C: "#155E75",
  G: "#9A3412", F: "#9D174D", P: "#5B21B6",
};
export function queueColor(kode: string): string {
  return QUEUE_COLORS[kode.toUpperCase()] ?? "#046C4E";
}

export function ownerName(t: Tiket): string {
  return (t.atasNama || "").trim() || "Tamu";
}

export const LS =   {
  auth: "antrian.auth",
  jenis: "antrian.jenisAntrian",
  tiket: "antrian.tiket",
  counter: "antrian.counter", 
} as const;
