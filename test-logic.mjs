const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const base = "file:///" + process.cwd().replace(/\\/g, "/") + "/dist/";
const S = await import(new URL("storage.js", base));

let pass = 0, fail = 0;
function check(label, got, want) {
  const ok = String(got) === String(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  (got=${got} want=${want})`);
  ok ? pass++ : fail++;
}

S.seedIfEmpty();
check("seed count", S.getJenis().length, 6);

S.issueTiket("A", "Normal", "Emily");  
S.issueTiket("A", "Normal", "Michael");  
S.issueTiket("A", "VIP", "Avery");     
S.issueTiket("A", "Lansia", "Rafi");  
check("priority head is VIP A-003", S.waitingSorted("A")[0].nomor, "A-003");
check("ticket carries its owner", S.waitingSorted("A")[0].atasNama, "Avery");

check("owner required", S.issueTiket("A", "Normal", "   ").ok, false);

const c1 = S.panggilBerikutnya("A");
check("first called VIP", c1.prioritas, "VIP");
const c2 = S.panggilBerikutnya("A");
check("second called Lansia", c2.prioritas, "Lansia");
check("A-003 finished", S.getTiket().find((t) => t.nomor === "A-003").status, "Selesai");

check("dup kode rejected", S.addJenis("A", "Baru").ok, false);
check("dup nama case-insens rejected", S.addJenis("Z", "umum-1").ok, false);
check("bad kode rejected", S.addJenis("aa", "X").ok, false);
check("valid add accepted", S.addJenis("K", "KULIT").ok, true);

check("inactive blocks issue", (() => { S.toggleJenis("K"); return S.issueTiket("K", "Normal", "Tono").ok; })(), false);

S.resetAntrian();
check("reset clears tickets", S.getTiket().length, 0);
S.issueTiket("A", "Normal", "Emily");
check("numbering reset to 001", S.getTiket()[0].nomor, "A-001");
check("owner survives reset path", S.getTiket()[0].atasNama, "Emily");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
