import React, { useState, useRef, useEffect } from "react";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Calculator, 
  ShieldCheck, 
  FileText, 
  ScanLine, 
  Gavel,
  ChevronRight,
  ChevronDown,
  Bell,
  User,
  ExternalLink,
  Download,
  Share2,
  MessageCircle,
  Mail,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Upload,
  ArrowRight,
  Zap,
  Activity,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Users,
  Calendar,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CompanyProfile } from "../types";

// ═══════════════════════════════════════════════════════════════
// KÖK BOYA PALETİ
// ═══════════════════════════════════════════════════════════════
const C = {
  mavi:"#1B4F8A", maviAcik:"#2E6DB4", maviSoluk:"#EBF2FA",
  kirmizi:"#8B1A1A", kirmiziAcik:"#B22222",
  yesil:"#2D6A4F", yesilAcik:"#40916C",
  sari:"#C9A227", sariAcik:"#F0C040",
  bg:"#FAF6F0", kart:"#FFFFFF", koyu:"#1C1410",
  metin:"#2C1810", ikinci:"#6B5744", ucuncu:"#A89080", sinir:"#DDD0C0",
  // Semantic Aliases for compatibility
  basari: "#2D6A4F",
  kritik: "#8B1A1A",
  bilgi: "#1B4F8A",
  uyari: "#C9A227",
  mor: "#8b5cf6",
  cyan: "#2E6DB4",
  turuncu: "#F0C040",
};

const para = (n: any) => {
  if (!n && n !== 0) return "—";
  return "₺" + Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2 });
};

const yuzde = (n: any) => {
  if (!n && n !== 0) return "—";
  return "%" + Number(n).toFixed(1);
};

/* ── ARAÇ KARTI SARMALAYICI ─────────────────────────── */
function AracKarti({ ikon, baslik, renk, children }: { ikon: string, baslik: string, renk: string, children: React.ReactNode }) {
  const [acik, setAcik] = useState(false);
  return (
    <div style={{
      background: C.kart, borderRadius: 14,
      border: acik ? `2px solid ${renk}` : `1px solid ${C.sinir}`,
      boxShadow: acik ? `0 4px 20px ${renk}15` : "0 1px 4px rgba(0,0,0,0.05)",
      overflow: "hidden", transition: "all 0.2s",
    }}>
      <div
        onClick={() => setAcik(!acik)}
        style={{
          padding: "16px 20px", display: "flex", alignItems: "center",
          gap: 14, cursor: "pointer",
          borderBottom: acik ? `1px solid ${C.sinir}` : "none",
          background: acik ? renk + "05" : C.kart,
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 11, flexShrink: 0,
          background: renk + "18", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 20,
        }}>{ikon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.metin }}>{baslik}</div>
          <div style={{ fontSize: 11, color: C.ucuncu, marginTop: 1 }}>
            {acik ? "Kapatmak için tıklayın" : "Hesaplamak için tıklayın"}
          </div>
        </div>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: renk + "15", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 14, color: renk, fontWeight: 800,
          transition: "transform 0.2s", transform: acik ? "rotate(180deg)" : "none",
        }}>▼</div>
      </div>
      {acik && <div style={{ padding: "20px" }}>{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// 2. OFİS VERİMLİLİK — Hesaplama Araçları
// ─────────────────────────────────────────────
function Giris({ label, value, onChange, type = "number", placeholder = "0", suffix, prefix, hint }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.ikinci, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      <div style={{ display: "flex" }}>
        {prefix && <span style={{ padding: "9px 12px", background: C.bg, border: `1px solid ${C.sinir}`, borderRight: "none", borderRadius: "8px 0 0 8px", fontSize: 13, color: C.ikinci, fontWeight: 600 }}>{prefix}</span>}
        <input 
          type={type} 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder}
          style={{ 
            flex: 1, 
            padding: "10px 14px", 
            border: `1px solid ${C.sinir}`, 
            borderRadius: prefix ? (suffix ? "0" : "0 8px 8px 0") : (suffix ? "8px 0 0 8px" : "8px"),
            fontSize: 14,
            outline: "none",
            background: "white",
            color: C.koyu,
            fontWeight: 500,
            transition: "all 0.2s ease"
          }}
        />
        {suffix && <span style={{ padding: "9px 12px", background: C.bg, border: `1px solid ${C.sinir}`, borderLeft: "none", borderRadius: "0 8px 8px 0", fontSize: 13, color: C.ikinci, fontWeight: 600 }}>{suffix}</span>}
      </div>
      {hint && <span style={{ fontSize: 10, color: "#94a3b8", fontStyle: "italic" }}>{hint}</span>}
    </div>
  );
}

function Secim({ label, value, onChange, secenekler }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: C.ikinci, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        padding: "9px 12px", border: `1px solid ${C.sinir}`, borderRadius: 8,
        fontSize: 14, color: C.metin, background: C.kart, outline: "none", fontFamily: "inherit",
      }}>
        {secenekler.map((s: any) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  );
}

function SonucSatiri({ label, deger, renk, bold, alt }: any) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 14px",
      background: bold ? renk + "08" : C.bg,
      borderRadius: 8,
      border: bold ? `1px solid ${renk}20` : "none",
    }}>
      <div>
        <div style={{ fontSize: 13, color: bold ? C.metin : C.ikinci, fontWeight: bold ? 700 : 500 }}>{label}</div>
        {alt && <div style={{ fontSize: 11, color: C.ucuncu }}>{alt}</div>}
      </div>
      <div style={{ fontSize: bold ? 17 : 14, fontWeight: bold ? 800 : 600, color: renk || C.metin }}>{deger}</div>
    </div>
  );
}

function Badge({ label, renk }: any) {
  return (
    <span style={{
      padding: "2px 8px", borderRadius: 6, background: renk + "15",
      color: renk, fontSize: 10, fontWeight: 800, textTransform: "uppercase"
    }}>{label}</span>
  );
}

function HesaplaBtn({ onClick, renk }: any) {
  return (
    <button onClick={onClick} style={{
      width: "100%", padding: "11px", background: renk, color: "#fff",
      border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700,
      cursor: "pointer", marginTop: 4,
    }}>Hesapla</button>
  );
}

function Grid({ children, cols = 2 }: { children: React.ReactNode, cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {children}
    </div>
  );
}

const Bolum = ({ children }: { children: React.ReactNode }) => {
  return <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>;
}

// ─────────────────────────────────────────────
// 3. PANEL (DASHBOARD)
// ─────────────────────────────────────────────
function Panel() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");

  const loadData = () => {
    const storedTasks = localStorage.getItem('bitig_tasks');
    if (storedTasks) setTasks(JSON.parse(storedTasks).slice(0, 5));
    const storedNotes = localStorage.getItem('bitig_general_notes');
    if (storedNotes) setGeneralNotes(storedNotes);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {[
          { label: "Bekleyen Görev", deger: tasks.filter(t => !t.completed).length.toString(), renk: C.uyari, ikon: <Clock size={20} /> },
          { label: "Toplam Tasarruf", deger: "₺142.5K", renk: C.basari, ikon: <TrendingUp size={20} /> },
          { label: "Aktif Müşteri", deger: "45", renk: C.bilgi, ikon: <User size={20} /> },
          { label: "Yeni Mevzuat", deger: "3", renk: C.mor, ikon: <Bell size={20} /> },
        ].map((k, i) => (
          <div key={i} style={{ background: C.kart, padding: 20, borderRadius: 16, border: `1px solid ${C.sinir}`, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: k.renk + "15", color: k.renk, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {k.ikon}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.ucuncu, textTransform: "uppercase", letterSpacing: "0.05em" }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.metin }}>{k.deger}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Son İşlemler */}
        <div style={{ background: C.kart, borderRadius: 16, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.sinir}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.metin, margin: 0 }}>Son Hesaplamalar & İşlemler</h3>
            <button style={{ fontSize: 11, fontWeight: 700, color: C.bilgi, background: "none", border: "none", cursor: "pointer" }}>Tümünü Gör</button>
          </div>
          <div style={{ padding: 0 }}>
            {[
              { ad: "Kıdem Tazminatı Hesaplama", tarih: "10 dk önce", tutar: "₺84.250", ikon: "👷", renk: C.mor },
              { ad: "KDV Hesaplama", tarih: "2 saat önce", tutar: "₺12.400", ikon: "🧾", renk: C.uyari },
              { ad: "Amortisman Hesaplama", tarih: "Dün", tutar: "₺148.500", ikon: "🏭", renk: C.turuncu },
              { ad: "Kira Artışı Hesaplama", tarih: "2 gün önce", tutar: "₺18.200", ikon: "🏢", renk: C.basari },
            ].map((is, i) => (
              <div key={i} style={{ padding: "14px 20px", borderBottom: i < 3 ? `1px solid ${C.sinir}` : "none", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 20 }}>{is.ikon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.metin }}>{is.ad}</div>
                  <div style={{ fontSize: 11, color: C.ucuncu }}>{is.tarih}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: is.renk }}>{is.tutar}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mevzuat Alarmları */}
        <div style={{ background: C.kart, borderRadius: 16, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.sinir}`, background: C.kritik + "10" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.kritik, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Bell size={16} /> Yeni Mevzuat Alarmı
            </h3>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { baslik: "7491 Sayılı Kanun Değişikliği", etki: "YÜKSEK", renk: C.kritik },
              { baslik: "E-Defter Berat Yükleme Süreleri", etki: "ORTA", renk: C.uyari },
              { baslik: "Asgari Ücret Teşvik Genelgesi", etki: "BİLGİ", renk: C.bilgi },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.metin }}>{m.baslik}</span>
                  <Badge label={m.etki} renk={m.renk} />
                </div>
                <div style={{ fontSize: 11, color: C.ucuncu }}>Resmi Gazete · 04.03.2026</div>
              </div>
            ))}
            <button style={{ width: "100%", padding: "10px", background: C.bg, border: `1px solid ${C.sinir}`, borderRadius: 10, color: C.metin, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
              Tüm Mevzuatı İncele
            </button>
          </div>
        </div>
      </div>

      {/* New Row: Reminders and General Notes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Hatırlatıcılar (Tasks) */}
        <div style={{ background: C.kart, borderRadius: 16, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.sinir}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.metin, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={16} className="text-kilim-red" /> Güncel Hatırlatıcılar
            </h3>
          </div>
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            {tasks.length > 0 ? (
              tasks.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px", background: C.bg, borderRadius: 12, border: `1px solid ${C.sinir}` }}>
                  <div style={{ color: t.completed ? C.yesil : C.ucuncu }}>
                    {t.completed ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.metin, textDecoration: t.completed ? "line-through" : "none" }}>{t.text}</div>
                    {t.date && <div style={{ fontSize: 10, color: C.ucuncu }}>📅 {t.date}</div>}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: C.ucuncu, fontSize: 12, fontStyle: "italic" }}>
                Henüz bir hatırlatıcı eklenmedi.
              </div>
            )}
          </div>
        </div>

        {/* Genel Notlar */}
        <div style={{ background: C.kart, borderRadius: 16, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.sinir}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: C.metin, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={16} className="text-kilim-blue" /> Genel Notlar & Ajanda
            </h3>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ 
              background: "#FFF9E6", 
              padding: "16px", 
              borderRadius: 12, 
              border: "1px solid #FFEBB3",
              minHeight: "120px",
              fontSize: 13,
              color: "#856404",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap"
            }}>
              {generalNotes || "Danışman üzerinden eklediğiniz genel notlar burada görünecektir."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── 1. AMORTİSMAN HESABI ── */
function Amortisman() {
  const [maliyet, setMaliyet] = useState("");
  const [sure, setSure] = useState("");
  const [yontem, setYontem] = useState("normal");
  const [kv, setKv] = useState("");
  const [sonuc, setSonuc] = useState<any>(null);

  const hesapla = () => {
    const m = parseFloat(maliyet); const s = parseInt(sure); const k = parseFloat(kv) || 0;
    if (!m || !s) return;
    const oran = 1 / s;
    if (yontem === "normal") {
      const yillik = (m - k) * oran;
      const aylik = yillik / 12;
      const tabloData = Array.from({ length: s }, (_, i) => ({
        yil: i + 1, amortisman: yillik,
        birikmiş: yillik * (i + 1),
        netDeger: m - yillik * (i + 1),
      }));
      setSonuc({ yontem: "normal", yillik, aylik, oran: oran * 100, tablo: tabloData, maliyet: m });
    } else {
      let kalan = m; const satirlar = [];
      for (let i = 0; i < s; i++) {
        const amortisman = kalan * oran * 2;
        const gercek = i === s - 1 ? kalan : Math.min(amortisman, kalan);
        kalan -= gercek;
        satirlar.push({ yil: i + 1, amortisman: gercek, birikmiş: m - kalan, netDeger: kalan });
        if (kalan <= 0) break;
      }
      setSonuc({ yontem: "azalan", yillik: satirlar[0]?.amortisman, aylik: satirlar[0]?.amortisman / 12, oran: oran * 2 * 100, tablo: satirlar, maliyet: m });
    }
  };

  return (
    <Bolum>
      <Grid>
        <Giris label="Varlık Maliyeti" value={maliyet} onChange={setMaliyet} prefix="₺" placeholder="100.000" />
        <Giris label="Faydalı Ömür" value={sure} onChange={setSure} suffix="Yıl" placeholder="5" />
      </Grid>
      <Grid>
        <Secim label="Amortisman Yöntemi" value={yontem} onChange={setYontem} secenekler={[
          { value: "normal", label: "Normal (Eşit Paylı)" },
          { value: "azalan", label: "Azalan Bakiyeler" },
        ]} />
        <Giris label="Kalıntı Değer (opsiyonel)" value={kv} onChange={setKv} prefix="₺" placeholder="0" />
      </Grid>
      <HesaplaBtn onClick={hesapla} renk={C.turuncu} />
      {sonuc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <Grid>
            <SonucSatiri label="Yıllık Amortisman" deger={para(sonuc.yillik)} renk={C.turuncu} bold />
            <SonucSatiri label="Aylık Amortisman" deger={para(sonuc.aylik)} renk={C.turuncu} bold />
          </Grid>
          <SonucSatiri label="Amortisman Oranı" deger={`%${sonuc.oran.toFixed(2)}`} renk={C.ikinci} />
          <div style={{ marginTop: 4, borderRadius: 10, overflow: "hidden", border: `1px solid ${C.sinir}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", background: C.koyu, padding: "8px 12px" }}>
              {["Yıl", "Amortisman", "Birikmiş", "Net Değer"].map(h => (
                <span key={h} style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.04em" }}>{h}</span>
              ))}
            </div>
            {sonuc.tablo.map((r: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", padding: "8px 12px", borderBottom: i < sonuc.tablo.length - 1 ? `1px solid ${C.sinir}` : "none", background: i % 2 === 0 ? C.kart : C.bg }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.metin }}>{r.yil}. Yıl</span>
                <span style={{ fontSize: 13, color: C.turuncu, fontWeight: 600 }}>{para(r.amortisman)}</span>
                <span style={{ fontSize: 13, color: C.ikinci }}>{para(r.birikmiş)}</span>
                <span style={{ fontSize: 13, color: r.netDeger <= 0 ? C.kritik : C.metin }}>{para(r.netDeger)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Bolum>
  );
}

/* ── 2. REESKONT FAİZİ ── */
function Reeskont() {
  const [tutar, setTutar] = useState("");
  const [gun, setGun] = useState("");
  const [oran, setOran] = useState("26");
  const [yontem, setYontem] = useState("ic");
  const [sonuc, setSonuc] = useState<any>(null);

  const hesapla = () => {
    const t = parseFloat(tutar); const g = parseInt(gun); const o = parseFloat(oran) / 100;
    if (!t || !g) return;
    let faiz, anapar;
    if (yontem === "ic") {
      faiz = t - (t / (1 + o * g / 360));
      anapar = t - faiz;
    } else {
      faiz = t * o * g / 360;
      anapar = t;
    }
    setSonuc({ faiz, anapar, vade: t, gun: g, oran: parseFloat(oran) });
  };

  return (
    <Bolum>
      <Grid>
        <Giris label="Senet / Alacak Tutarı" value={tutar} onChange={setTutar} prefix="₺" placeholder="50.000" />
        <Giris label="Vade Gün Sayısı" value={gun} onChange={setGun} suffix="Gün" placeholder="90" />
      </Grid>
      <Grid>
        <Giris label="Reeskont Faiz Oranı (Yıllık)" value={oran} onChange={setOran} suffix="%" hint="TCMB 2026: %26" />
        <Secim label="Hesaplama Yöntemi" value={yontem} onChange={setYontem} secenekler={[
          { value: "ic", label: "İç İskonto" },
          { value: "dis", label: "Dış İskonto" },
        ]} />
      </Grid>
      <HesaplaBtn onClick={hesapla} renk={C.cyan} />
      {sonuc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <Grid>
            <SonucSatiri label="Reeskont Faizi" deger={para(sonuc.faiz)} renk={C.cyan} bold />
            <SonucSatiri label="Bugünkü Değer" deger={para(sonuc.anapar)} renk={C.cyan} bold />
          </Grid>
          <SonucSatiri label="Vade Tutarı" deger={para(sonuc.vade)} renk={C.ikinci} />
          <SonucSatiri label="Efektif Oran" deger={`%${(sonuc.faiz / sonuc.anapar * 100).toFixed(4)}`} renk={C.ikinci} />
          <div style={{ padding: "10px 14px", background: C.cyan + "0a", border: `1px solid ${C.cyan}20`, borderRadius: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.cyan, marginBottom: 3 }}>📋 Muhasebe Notu</div>
            <div style={{ fontSize: 12, color: C.ikinci, lineHeight: 1.6 }}>
              Dönem sonu reeskont için 657 / 122 (alacak senetleri) veya 780 / 322 (borç senetleri) hesaplarını kullanın.
            </div>
          </div>
        </div>
      )}
    </Bolum>
  );
}

/* ── 3. KIDEM TAZMİNATI ── */
function KidemTazminati() {
  const [brut, setBrut] = useState("");
  const [yil, setYil] = useState("");
  const [ay, setAy] = useState("0");
  const [gun, setGun] = useState("0");
  const [ek, setEk] = useState("");
  const [sonuc, setSonuc] = useState<any>(null);

  const TAVAN = 47551.98; // 2026 kıdem tazminatı tavanı

  const hesapla = () => {
    const b = parseFloat(brut); const y = parseInt(yil) || 0;
    const a = parseInt(ay) || 0; const g = parseInt(gun) || 0;
    const ekOdeme = parseFloat(ek) || 0;
    if (!b || (!y && !a && !g)) return;

    const toplamAy = y * 12 + a + g / 30;
    const toplamYil = toplamAy / 12;
    const giydirilmisBrut = Math.min(b + ekOdeme, TAVAN);
    const tazminat = giydirilmisBrut * toplamYil;
    const damgaVergisi = tazminat * 0.00759;
    const net = tazminat - damgaVergisi;
    setSonuc({ tazminat, damgaVergisi, net, toplamYil, giydirilmisBrut, tavan: TAVAN });
  };

  return (
    <Bolum>
      <Grid>
        <Giris label="Brüt Ücret" value={brut} onChange={setBrut} prefix="₺" placeholder="30.000" />
        <Giris label="Ek Ödemeler (Yıllık Ort.)" value={ek} onChange={setEk} prefix="₺" placeholder="0" hint="İkramiye, prim vb. 1/12'si" />
      </Grid>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Giris label="Yıl" value={yil} onChange={setYil} suffix="Yıl" placeholder="5" />
        <Giris label="Ay" value={ay} onChange={setAy} suffix="Ay" placeholder="0" />
        <Giris label="Gün" value={gun} onChange={setGun} suffix="Gün" placeholder="0" />
      </div>
      <HesaplaBtn onClick={hesapla} renk={C.mor} />
      {sonuc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <Grid>
            <SonucSatiri label="Brüt Kıdem Tazminatı" deger={para(sonuc.tazminat)} renk={C.mor} bold />
            <SonucSatiri label="Net Kıdem Tazminatı" deger={para(sonuc.net)} renk={C.mor} bold />
          </Grid>
          <SonucSatiri label="Damga Vergisi (%0.759)" deger={para(sonuc.damgaVergisi)} renk={C.uyari} />
          <SonucSatiri label="Giydirilmiş Brüt Ücret" deger={para(sonuc.giydirilmisBrut)} renk={C.ikinci} />
          <SonucSatiri label="Toplam Çalışma Süresi" deger={`${sonuc.toplamYil.toFixed(4)} yıl`} renk={C.ikinci} />
          {sonuc.giydirilmisBrut >= sonuc.tavan && (
            <div style={{ padding: "10px 14px", background: C.uyari + "0a", border: `1px solid ${C.uyari}25`, borderRadius: 8, fontSize: 12, color: C.ikinci }}>
              ⚠️ <strong style={{ color: C.uyari }}>Tavan uygulandı.</strong> 2026 kıdem tazminatı tavanı {para(TAVAN)} olup hesaplama bu tavan üzerinden yapılmıştır.
            </div>
          )}
        </div>
      )}
    </Bolum>
  );
}

/* ── 4. GECİKME ZAMMI / FAİZ ── */
function GecikmeFaizi() {
  const [tutar, setTutar] = useState("");
  const [vade, setVade] = useState("");
  const [odeme, setOdeme] = useState("");
  const [tur, setTur] = useState("vergiFaizi");
  const [sonuc, setSonuc] = useState<any>(null);

  const oranlar: any = {
    vergiFaizi: { oran: 4.5, label: "Vergi Faizi (%4.5/ay)" },
    gecikmeZammi: { oran: 5.0, label: "Gecikme Zammı (%5.0/ay)" },
    temerrut: { oran: 26, label: "Ticari Temerrüt Faizi (%26/yıl)" },
    yasal: { oran: 9, label: "Yasal Faiz (%9/yıl)" },
  };

  const hesapla = () => {
    const t = parseFloat(tutar);
    if (!t || !vade || !odeme) return;
    const vadeDate = new Date(vade);
    const odemeDate = new Date(odeme);
    const gunFarki = Math.max(0, Math.floor((odemeDate.getTime() - vadeDate.getTime()) / (1000 * 60 * 60 * 24)));
    const secilen = oranlar[tur];
    let faiz;
    if (tur === "vergiFaizi" || tur === "gecikmeZammi") {
      const ay = gunFarki / 30;
      faiz = t * (secilen.oran / 100) * ay;
    } else {
      faiz = t * (secilen.oran / 100) * gunFarki / 365;
    }
    setSonuc({ faiz, toplam: t + faiz, gun: gunFarki, tutar: t, tur: secilen.label });
  };

  return (
    <Bolum>
      <Giris label="Borç / Alacak Tutarı" value={tutar} onChange={setTutar} prefix="₺" placeholder="10.000" />
      <Grid>
        <Giris label="Vade / Doğum Tarihi" value={vade} onChange={setVade} type="date" placeholder="" />
        <Giris label="Ödeme / Hesap Tarihi" value={odeme} onChange={setOdeme} type="date" placeholder="" />
      </Grid>
      <Secim label="Faiz / Zam Türü" value={tur} onChange={setTur} secenekler={[
        { value: "vergiFaizi", label: "Vergi Faizi (%4.5/ay)" },
        { value: "gecikmeZammi", label: "Gecikme Zammı (%5.0/ay)" },
        { value: "temerrut", label: "Ticari Temerrüt Faizi (%26/yıl)" },
        { value: "yasal", label: "Yasal Faiz (%9/yıl)" },
      ]} />
      <HesaplaBtn onClick={hesapla} renk={C.kritik} />
      {sonuc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <Grid>
            <SonucSatiri label="Gecikme Faizi / Zammı" deger={para(sonuc.faiz)} renk={C.kritik} bold />
            <SonucSatiri label="Toplam Borç" deger={para(sonuc.toplam)} renk={C.kritik} bold />
          </Grid>
          <SonucSatiri label="Gecikme Süresi" deger={`${sonuc.gun} gün`} renk={C.ikinci} />
          <SonucSatiri label="Uygulanan Oran" deger={sonuc.tur} renk={C.ikinci} />
        </div>
      )}
    </Bolum>
  );
}

/* ── 5. KİRA ARTIŞI (TÜFE/ÜFE) ── */
function KiraArtisi() {
  const [kira, setKira] = useState("");
  const [tufe, setTufe] = useState("");
  const [ufe, setUfe] = useState("");
  const [tur, setTur] = useState("tufe");
  const [sonuc, setSonuc] = useState<any>(null);

  const hesapla = () => {
    const k = parseFloat(kira);
    const t = parseFloat(tufe);
    const u = parseFloat(ufe);
    if (!k) return;

    let oran, yeniKira, aciklama;
    if (tur === "tufe") {
      oran = t; yeniKira = k * (1 + t / 100);
      aciklama = "TBK Md.344 gereği konut kiralarında artış oranı TÜFE ile sınırlıdır.";
    } else if (tur === "ufe") {
      oran = u; yeniKira = k * (1 + u / 100);
      aciklama = "İşyeri kiralarında taraflar TÜFE veya ÜFE oranlarından birini seçebilir.";
    } else {
      oran = (t + u) / 2; yeniKira = k * (1 + oran / 100);
      aciklama = "TÜFE ve ÜFE ortalaması kullanıldı.";
    }
    setSonuc({ oran, yeniKira, artis: yeniKira - k, eskiKira: k, aciklama });
  };

  return (
    <Bolum>
      <Giris label="Mevcut Kira Bedeli" value={kira} onChange={setKira} prefix="₺" placeholder="15.000" />
      <Grid>
        <Giris label="TÜFE (12 Aylık Ortalama)" value={tufe} onChange={setTufe} suffix="%" placeholder="47.8" hint="TÜİK son açıklama" />
        <Giris label="ÜFE (12 Aylık Ortalama)" value={ufe} onChange={setUfe} suffix="%" placeholder="38.2" hint="TÜİK son açıklama" />
      </Grid>
      <Secim label="Artış Esası" value={tur} onChange={setTur} secenekler={[
        { value: "tufe", label: "TÜFE (Konut - Yasal Sınır)" },
        { value: "ufe", label: "ÜFE (İşyeri)" },
        { value: "ort", label: "TÜFE + ÜFE Ortalaması" },
      ]} />
      <HesaplaBtn onClick={hesapla} renk={C.basari} />
      {sonuc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <Grid>
            <SonucSatiri label="Yeni Kira Bedeli" deger={para(sonuc.yeniKira)} renk={C.basari} bold />
            <SonucSatiri label="Artış Tutarı" deger={para(sonuc.artis)} renk={C.basari} bold />
          </Grid>
          <SonucSatiri label="Uygulanan Artış Oranı" deger={`%${sonuc.oran.toFixed(2)}`} renk={C.ikinci} />
          <div style={{ padding: "10px 14px", background: C.basari + "0a", border: `1px solid ${C.basari}20`, borderRadius: 8, fontSize: 12, color: C.ikinci, lineHeight: 1.6 }}>
            ⚖️ {sonuc.aciklama}
          </div>
        </div>
      )}
    </Bolum>
  );
}

/* ── 6. YENİDEN DEĞERLEME ── */
function YenidenDegerleme() {
  const [maliyet, setMaliyet] = useState("");
  const [bAmor, setBAMor] = useState("");
  const [oran, setOran] = useState("43.94");
  const [sonuc, setSonuc] = useState<any>(null);

  const hesapla = () => {
    const m = parseFloat(maliyet); const b = parseFloat(bAmor) || 0; const o = parseFloat(oran) / 100;
    if (!m) return;
    const netDeger = m - b;
    const yeniMaliyet = m * (1 + o);
    const yeniBAmor = b * (1 + o);
    const yeniNetDeger = netDeger * (1 + o);
    const artis = yeniNetDeger - netDeger;
    setSonuc({ yeniMaliyet, yeniBAmor, yeniNetDeger, artis, netDeger, oran: parseFloat(oran) });
  };

  return (
    <Bolum>
      <Grid>
        <Giris label="Varlığın Maliyet Bedeli" value={maliyet} onChange={setMaliyet} prefix="₺" placeholder="500.000" />
        <Giris label="Birikmiş Amortisman" value={bAmor} onChange={setBAMor} prefix="₺" placeholder="200.000" />
      </Grid>
      <Giris label="Yeniden Değerleme Oranı" value={oran} onChange={setOran} suffix="%" hint="2025 yılı için %43.94 (VUK tebliği)" />
      <HesaplaBtn onClick={hesapla} renk={C.bilgi} />
      {sonuc && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <Grid>
            <SonucSatiri label="Yeni Maliyet Bedeli" deger={para(sonuc.yeniMaliyet)} renk={C.bilgi} bold />
            <SonucSatiri label="Değer Artış Fonu" deger={para(sonuc.artis)} renk={C.bilgi} bold />
          </Grid>
          <SonucSatiri label="Yeni Birikmiş Amortisman" deger={para(sonuc.yeniBAmor)} renk={C.ikinci} />
          <SonucSatiri label="Yeni Net Defter Değeri" deger={para(sonuc.yeniNetDeger)} renk={C.ikinci} />
          <SonucSatiri label="Eski Net Defter Değeri" deger={para(sonuc.netDeger)} renk={C.ucuncu} />
          <div style={{ padding: "10px 14px", background: C.bilgi + "0a", border: `1px solid ${C.bilgi}20`, borderRadius: 8, fontSize: 12, color: C.ikinci, lineHeight: 1.6 }}>
            📋 Değer artış fonu 522 hesabına alınır. Kurumlar vergisi matrahına dahil edilmez (şartlar sağlandığında).
          </div>
        </div>
      )}
    </Bolum>
  );
}

/* ── 7. KDV HESAPLAMALARI ── */
function KDVHesap() {
  const [altSekme, setAltSekme] = useState("dahilHaric");

  // Dahil/Hariç
  const [tutar, setTutar] = useState("");
  const [kdvOrani, setKdvOrani] = useState("20");
  const [isDahil, setIsDahil] = useState(true);
  const [dahilHaricSonuc, setDahilHaricSonuc] = useState<any>(null);

  // Özel Matrah
  const [omTutar, setOmTutar] = useState("");
  const [omOran, setOmOran] = useState("20");
  const [omSonuc, setOmSonuc] = useState<any>(null);

  // Tevkifat
  const [tevTutar, setTevTutar] = useState("");
  const [tevOran, setTevOran] = useState("20");
  const [tevkifatOrani, setTevkifatOrani] = useState("2/10");
  const [tevSonuc, setTevSonuc] = useState<any>(null);

  const dahilHaricHesapla = () => {
    const t = parseFloat(tutar); const o = parseFloat(kdvOrani) / 100;
    if (!t) return;
    
    if (isDahil) {
      const kdvHaric = t / (1 + o);
      const kdv = t - kdvHaric;
      setDahilHaricSonuc({ matrah: kdvHaric, kdv, toplam: t, tip: 'Dahil' });
    } else {
      const kdv = t * o;
      const kdvDahil = t + kdv;
      setDahilHaricSonuc({ matrah: t, kdv, toplam: kdvDahil, tip: 'Hariç' });
    }
  };

  const ozelMatrahHesapla = () => {
    const t = parseFloat(omTutar); const o = parseFloat(omOran) / 100;
    if (!t) return;
    const kdv = t * o;
    setOmSonuc({ matrah: t, kdv, toplam: t + kdv });
  };

  const tevkifatHesapla = () => {
    const t = parseFloat(tevTutar); const o = parseFloat(tevOran) / 100;
    if (!t) return;
    const kdv = t * o;
    const [pay, payda] = tevkifatOrani.split("/").map(Number);
    const tevkifatTutar = kdv * (pay / payda);
    const saticiKdv = kdv - tevkifatTutar;
    setTevSonuc({ matrah: t, kdv, tevkifatTutar, saticiKdv, oran: tevkifatOrani });
  };

  const altSekmeler = [
    { id: "dahilHaric", label: "KDV Dahil/Hariç" },
    { id: "ozelMatrah", label: "Özel Matrah" },
    { id: "tevkifat", label: "Tevkifat Oranı" },
  ];

  return (
    <Bolum>
      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.sinir}`, marginBottom: 4 }}>
        {altSekmeler.map(s => (
          <button key={s.id} onClick={() => setAltSekme(s.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 16px", fontSize: 12,
            fontWeight: altSekme === s.id ? 700 : 500,
            color: altSekme === s.id ? C.uyari : C.ikinci,
            borderBottom: altSekme === s.id ? `2px solid ${C.uyari}` : "2px solid transparent",
          }}>{s.label}</button>
        ))}
      </div>

      {altSekme === "dahilHaric" && (
        <Bolum>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button 
              onClick={() => setIsDahil(true)}
              style={{
                flex: 1, padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                background: isDahil ? C.uyari : C.bg,
                color: isDahil ? "white" : C.ikinci,
                border: `1px solid ${isDahil ? C.uyari : C.sinir}`,
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              KDV Dahil Giriş
            </button>
            <button 
              onClick={() => setIsDahil(false)}
              style={{
                flex: 1, padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
                background: !isDahil ? C.uyari : C.bg,
                color: !isDahil ? "white" : C.ikinci,
                border: `1px solid ${!isDahil ? C.uyari : C.sinir}`,
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              KDV Hariç Giriş
            </button>
          </div>
          <Grid>
            <Giris 
              label={isDahil ? "Tutar (KDV Dahil)" : "Tutar (KDV Hariç)"} 
              value={tutar} 
              onChange={setTutar} 
              prefix="₺" 
              placeholder="10.000" 
            />
            <Secim label="KDV Oranı" value={kdvOrani} onChange={setKdvOrani} secenekler={[
              { value: "1", label: "%1" }, { value: "10", label: "%10" }, { value: "20", label: "%20" },
            ]} />
          </Grid>
          <HesaplaBtn onClick={dahilHaricHesapla} renk={C.uyari} />
          {dahilHaricSonuc && (
            <div style={{ marginTop: 12, background: C.bg, borderRadius: 16, padding: "20px", border: `1px solid ${C.sinir}`, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 16 }}>
                <div style={{ width: 4, height: 16, background: C.uyari, borderRadius: 4 }} />
                <div style={{ fontSize: 11, fontWeight: 800, color: C.ikinci, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Hesaplama Detayı ({dahilHaricSonuc.tip} Giriş)
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <SonucSatiri label="Matrah (KDV Hariç)" deger={para(dahilHaricSonuc.matrah)} renk={C.metin} />
                <SonucSatiri label="KDV Tutarı" deger={para(dahilHaricSonuc.kdv)} renk={C.uyari} />
                <div style={{ height: 1, background: C.sinir, margin: "4px 0" }} />
                <SonucSatiri label="Genel Toplam (KDV Dahil)" deger={para(dahilHaricSonuc.toplam)} renk={C.metin} bold />
              </div>
            </div>
          )}
        </Bolum>
      )}

      {altSekme === "ozelMatrah" && (
        <Bolum>
          <Grid>
            <Giris label="Özel Matrah Tutarı" value={omTutar} onChange={setOmTutar} prefix="₺" placeholder="5.000" />
            <Secim label="KDV Oranı" value={omOran} onChange={setOmOran} secenekler={[
              { value: "1", label: "%1" }, { value: "10", label: "%10" }, { value: "20", label: "%20" },
            ]} />
          </Grid>
          <HesaplaBtn onClick={ozelMatrahHesapla} renk={C.uyari} />
          {omSonuc && (
            <Grid>
              <SonucSatiri label="Hesaplanan KDV" deger={para(omSonuc.kdv)} renk={C.uyari} bold />
              <SonucSatiri label="KDV Dahil Toplam" deger={para(omSonuc.toplam)} renk={C.uyari} bold />
            </Grid>
          )}
        </Bolum>
      )}

      {altSekme === "tevkifat" && (
        <Bolum>
          <Grid>
            <Giris label="Matrah (KDV Hariç)" value={tevTutar} onChange={setTevTutar} prefix="₺" placeholder="20.000" />
            <Secim label="KDV Oranı" value={tevOran} onChange={setTevOran} secenekler={[
              { value: "1", label: "%1" }, { value: "10", label: "%10" }, { value: "20", label: "%20" },
            ]} />
          </Grid>
          <Secim label="Tevkifat Oranı" value={tevkifatOrani} onChange={setTevkifatOrani} secenekler={[
            { value: "2/10", label: "2/10 — Yapım İşleri" },
            { value: "3/10", label: "3/10 — İşgücü, Temizlik" },
            { value: "4/10", label: "4/10 — Makine, Servis" },
            { value: "5/10", label: "5/10 — Danışmanlık" },
            { value: "7/10", label: "7/10 — Reklam, Güvenlik" },
            { value: "9/10", label: "9/10 — Kiralama, Yazılım" },
          ]} />
          <HesaplaBtn onClick={tevkifatHesapla} renk={C.uyari} />
          {tevSonuc && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <Grid>
                <SonucSatiri label={`Alıcı Öder (${tevSonuc.oran})`} deger={para(tevSonuc.tevkifatTutar)} renk={C.kritik} bold />
                <SonucSatiri label="Satıcıda Kalan KDV" deger={para(tevSonuc.saticiKdv)} renk={C.basari} bold />
              </Grid>
              <SonucSatiri label="Toplam KDV" deger={para(tevSonuc.kdv)} renk={C.ikinci} />
              <SonucSatiri label="Matrah" deger={para(tevSonuc.matrah)} renk={C.ikinci} />
            </div>
          )}
        </Bolum>
      )}
    </Bolum>
  );
}

// ─────────────────────────────────────────────
// 3. FİNANSAL DURUM — Firma Analiz Merkezi
// ─────────────────────────────────────────────
function FinansalDurum() {
  const [aktifSekme, setAktifSekme] = useState("bilanco");

  // Mock bilanço verileri
  const donenVT = 928500; const duranVT = 385000;
  const toplamAktif = donenVT + duranVT;
  const kvykT = 404700; const uvykT = 380000; const ozkaynakT = 528800;
  const netSatis = 725000; const brutKar = 265000; const netKar = 93750;
  const brutKarMarji = (brutKar / netSatis) * 100;
  const netKarMarji = (netKar / netSatis) * 100;
  const cariOran = donenVT / kvykT;
  const borcOzkaynak = (kvykT + uvykT) / ozkaynakT;
  const roe = (netKar / ozkaynakT) * 100;

  const sekmeler = [
    { id: "bilanco", label: "Bilanço" },
    { id: "gelir", label: "Gelir Tablosu" },
    { id: "rasyo", label: "Rasyo Analizi" },
    { id: "kdv", label: "KDV & Teknik" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Mizan yükleme uyarısı */}
      <div style={{ background: C.uyari + "0d", border: `1px solid ${C.uyari}30`, borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.metin }}>BİTİG TEKNOLOJİ A.Ş. — Şubat 2026</div>
            <div style={{ fontSize: 12, color: C.ikinci }}>Mizan yüklendi · Son güncelleme: 04.03.2026</div>
          </div>
        </div>
        <button style={{ background: C.bilgi, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🔄 Mizan Güncelle</button>
      </div>

      {/* KPI şeridi */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }}>
        {[
          { label: "Toplam Aktif", deger: para(toplamAktif), renk: C.bilgi },
          { label: "Net Kâr", deger: para(netKar), renk: C.basari },
          { label: "Brüt Marj", deger: yuzde(brutKarMarji), renk: C.basari },
          { label: "KDV İade Pot.", deger: para(56200), renk: C.mor },
          { label: "Kritik Uyarı", deger: "3 kalem", renk: C.uyari },
        ].map((k, i) => (
          <div key={i} style={{ background: C.kart, borderRadius: 12, padding: "12px 14px", border: `1px solid ${C.sinir}`, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.ucuncu, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: k.renk, marginTop: 4 }}>{k.deger}</div>
          </div>
        ))}
      </div>

      {/* Sekmeler */}
      <div style={{ display: "flex", background: C.kart, borderRadius: 12, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
        {sekmeler.map(s => (
          <button key={s.id} onClick={() => setAktifSekme(s.id)} style={{
            flex: 1, padding: "12px", border: "none", cursor: "pointer", fontFamily: "inherit",
            background: aktifSekme === s.id ? C.bilgi : C.kart,
            color: aktifSekme === s.id ? "#fff" : C.ikinci,
            fontSize: 13, fontWeight: aktifSekme === s.id ? 700 : 500,
            borderRight: `1px solid ${C.sinir}`,
          }}>{s.label}</button>
        ))}
      </div>

      {/* Bilanço */}
      {aktifSekme === "bilanco" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            {
              baslik: "AKTİF", renk: C.bilgi, toplam: para(toplamAktif),
              gruplar: [
                { ad: "Dönen Varlıklar", toplam: para(donenVT), satirlar: [{ hesap: "100/102", ad: "Kasa & Banka", tutar: para(258000) }, { hesap: "120", ad: "Alıcılar", tutar: para(342000) }, { hesap: "150/153", ad: "Stoklar", tutar: para(180000) }, { hesap: "190", ad: "Devreden KDV", tutar: para(148500) }] },
                { ad: "Duran Varlıklar", toplam: para(duranVT), satirlar: [{ hesap: "253/255", ad: "Demirbaşlar", tutar: para(505000) }, { hesap: "268", ad: "Birikmiş Amortisman", tutar: "(" + para(120000) + ")" }] },
              ]
            },
            {
              baslik: "PASİF", renk: C.basari, toplam: para(kvykT + uvykT + ozkaynakT),
              gruplar: [
                { ad: "Kısa Vadeli Yükümlülükler", toplam: para(kvykT), satirlar: [{ hesap: "300", ad: "Banka Kredileri (KV)", tutar: para(85000) }, { hesap: "320", ad: "Satıcılar", tutar: para(215000) }, { hesap: "360/361", ad: "Ödenecek Vergi/SGK", tutar: para(12400) }, { hesap: "391", ad: "Hesaplanan KDV", tutar: para(92300) }] },
                { ad: "Uzun Vadeli Yükümlülükler", toplam: para(uvykT), satirlar: [{ hesap: "400", ad: "Banka Kredileri (UV)", tutar: para(380000) }] },
                { ad: "Özkaynak", toplam: para(ozkaynakT), satirlar: [{ hesap: "500", ad: "Sermaye", tutar: para(500000) }, { hesap: "570", ad: "Geçmiş Yıl Kârları", tutar: para(28800) }] },
              ]
            }
          ].map((taraf, ti) => (
            <div key={ti} style={{ background: C.kart, borderRadius: 14, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", background: taraf.renk, display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{taraf.baslik}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{taraf.toplam}</span>
              </div>
              {taraf.gruplar.map((g, gi) => (
                <div key={gi}>
                  <div style={{ padding: "8px 16px", background: C.bg, fontSize: 11, fontWeight: 700, color: C.ikinci, textTransform: "uppercase", display: "flex", justifyContent: "space-between" }}>
                    <span>{g.ad}</span><span>{g.toplam}</span>
                  </div>
                  {g.satirlar.map((r, ri) => (
                    <div key={ri} style={{ padding: "8px 16px", borderBottom: `1px solid ${C.sinir}`, display: "flex", justifyContent: "space-between", background: ri % 2 === 0 ? C.kart : C.bg }}>
                      <span style={{ fontSize: 12, color: C.ikinci }}><strong style={{ color: C.ucuncu }}>{r.hesap}</strong> {r.ad}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.metin }}>{r.tutar}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Gelir Tablosu */}
      {aktifSekme === "gelir" && (
        <div style={{ background: C.kart, borderRadius: 14, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 80px", padding: "8px 16px", background: C.koyu }}>
            {["Kalem", "Cari Dönem", "Önceki Dönem", "Değişim"].map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>{h}</span>)}
          </div>
          {[
            { ad: "Net Satışlar", cari: 725000, onceki: 633500, vurgula: false },
            { ad: "Satılan Mal Maliyeti (−)", cari: -460000, onceki: -420000, vurgula: false },
            { ad: "BRÜT KÂR", cari: 265000, onceki: 213500, vurgula: true },
            { ad: "Faaliyet Giderleri (−)", cari: -125000, onceki: -111000, vurgula: false },
            { ad: "FAALİYET KÂRI", cari: 140000, onceki: 102500, vurgula: true },
            { ad: "Finansman Giderleri (−)", cari: -28000, onceki: -24000, vurgula: false },
            { ad: "Diğer Gelirler", cari: 12000, onceki: 8000, vurgula: false },
            { ad: "VERGİ ÖNCESİ KÂR", cari: 125000, onceki: 86500, vurgula: true },
            { ad: "Kurumlar Vergisi (−)", cari: -31250, onceki: -21625, vurgula: false },
            { ad: "NET KÂR", cari: 93750, onceki: 64875, vurgula: true },
          ].map((r, i) => {
            const deg = r.onceki ? ((Math.abs(r.cari) - Math.abs(r.onceki)) / Math.abs(r.onceki) * 100) : 0;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 80px", padding: "9px 16px", borderBottom: `1px solid ${C.sinir}`, background: r.vurgula ? C.basari + "08" : i % 2 === 0 ? C.kart : C.bg, borderLeft: r.vurgula ? `3px solid ${C.basari}` : "3px solid transparent" }}>
                <span style={{ fontSize: 13, fontWeight: r.vurgula ? 800 : 500, color: r.vurgula ? C.basari : C.ikinci }}>{r.ad}</span>
                <span style={{ fontSize: 13, fontWeight: r.vurgula ? 800 : 600, color: r.cari >= 0 ? C.basari : C.kritik, textAlign: "right" }}>{para(Math.abs(r.cari))}</span>
                <span style={{ fontSize: 12, color: C.ucuncu, textAlign: "right" }}>{para(Math.abs(r.onceki))}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: deg >= 0 ? C.basari : C.kritik, textAlign: "right" }}>{deg >= 0 ? "+" : ""}{deg.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Rasyo Analizi */}
      {aktifSekme === "rasyo" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              grup: "Likidite Oranları", renk: C.bilgi,
              oranlar: [
                { ad: "Cari Oran", deger: cariOran.toFixed(2), hedef: "> 1.5", uygun: cariOran >= 1.5, aciklama: "Dönen varlıkların kısa vadeli borçlara oranı." },
                { ad: "Asit-Test", deger: ((donenVT - 180000) / kvykT).toFixed(2), hedef: "> 1.0", uygun: ((donenVT - 180000) / kvykT) >= 1, aciklama: "Stoklar hariç kısa vadeli likidite." },
                { ad: "Nakit Oranı", deger: (258000 / kvykT).toFixed(2), hedef: "> 0.5", uygun: (258000 / kvykT) >= 0.5, aciklama: "Sadece nakit ile kısa vadeli ödeme gücü." },
              ]
            },
            {
              grup: "Mali Yapı Oranları", renk: C.mor,
              oranlar: [
                { ad: "Borç/Özkaynak", deger: borcOzkaynak.toFixed(2), hedef: "< 1.5", uygun: borcOzkaynak < 1.5, aciklama: "Toplam borcun özkaynaklara oranı." },
                { ad: "Özkaynak Oranı", deger: yuzde((ozkaynakT / toplamAktif) * 100), hedef: "> %40", uygun: (ozkaynakT / toplamAktif) >= 0.4, aciklama: "Varlıkların özkaynak ile finansman oranı." },
              ]
            },
            {
              grup: "Kârlılık Oranları", renk: C.basari,
              oranlar: [
                { ad: "Brüt Kâr Marjı", deger: yuzde(brutKarMarji), hedef: "> %25", uygun: brutKarMarji >= 25, aciklama: "Satışlardan elde edilen brüt kâr oranı." },
                { ad: "Net Kâr Marjı", deger: yuzde(netKarMarji), hedef: "> %10", uygun: netKarMarji >= 10, aciklama: "Net kârın net satışlara oranı." },
                { ad: "ROE", deger: yuzde(roe), hedef: "> %15", uygun: roe >= 15, aciklama: "Özkaynak kârlılığı." },
              ]
            },
          ].map((g, gi) => (
            <div key={gi}>
              <div style={{ fontSize: 13, fontWeight: 800, color: g.renk, marginBottom: 10, paddingBottom: 6, borderBottom: `2px solid ${g.renk}` }}>{g.grup}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {g.oranlar.map((r, i) => (
                  <div key={i} style={{ background: (r.uygun ? C.basari : C.kritik) + "08", border: `1px solid ${(r.uygun ? C.basari : C.kritik)}20`, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.ikinci }}>{r.ad}</div>
                      <Badge label={r.uygun ? "İYİ" : "RİSK"} renk={r.uygun ? C.basari : C.kritik} />
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: r.uygun ? C.basari : C.kritik, marginBottom: 4 }}>{r.deger}</div>
                    <div style={{ fontSize: 11, color: C.ucuncu, marginBottom: 4 }}>Hedef: {r.hedef}</div>
                    <div style={{ fontSize: 12, color: C.ikinci }}>{r.aciklama}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KDV & Teknik Denetim */}
      {aktifSekme === "kdv" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {[
              { label: "İndirilecek KDV (190)", deger: para(148500), renk: C.bilgi },
              { label: "Hesaplanan KDV (391)", deger: para(92300), renk: C.metin },
              { label: "İade Potansiyeli", deger: para(56200), renk: C.mor },
            ].map((k, i) => (
              <div key={i} style={{ background: C.kart, borderRadius: 12, padding: "14px", border: `1px solid ${C.sinir}`, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.ucuncu, fontWeight: 700, textTransform: "uppercase" }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.renk, marginTop: 4 }}>{k.deger}</div>
              </div>
            ))}
          </div>
          <div style={{ background: C.kart, borderRadius: 14, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.sinir}`, fontSize: 13, fontWeight: 700, color: C.uyari }}>⚠️ Dikkat Gerektiren Hesaplar</div>
            {[
              { kod: "120", ad: "Alıcılar", sorun: "Ortalama tahsilat 68 gün — sektör ort. 45 gün", tutar: para(342000), renk: C.uyari },
              { kod: "320", ad: "Satıcılar", sorun: "Bakiye 90 günü aşıyor — ödeme planı önerilir", tutar: para(215000), renk: C.uyari },
              { kod: "100", ad: "Kasa", sorun: "Yüksek nakit tutulumu — verimlilik riski", tutar: para(12400), renk: C.bilgi },
            ].map((u, i) => (
              <div key={i} style={{ padding: "12px 16px", borderBottom: i < 2 ? `1px solid ${C.sinir}` : "none", display: "flex", alignItems: "center", gap: 12, borderLeft: `4px solid ${u.renk}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: u.renk + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: u.renk, flexShrink: 0 }}>{u.kod}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.metin }}>{u.ad}</div>
                  <div style={{ fontSize: 12, color: C.ikinci }}>{u.sorun}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 800, color: C.metin }}>{u.tutar}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 4. SGK TEŞVİK RAPORU
// ─────────────────────────────────────────────
const FIRMALAR = [
  { id: 1, ad: "BİTİG TEKNOLOJİ", statu: "LTD. ŞTİ.", sektor: "Yazılım", personel: 45 },
  { id: 2, ad: "ÖZDEMİR LOJİSTİK", statu: "A.Ş.", sektor: "Taşımacılık", personel: 120 },
  { id: 3, ad: "AKAY TEKSTİL", statu: "LTD. ŞTİ.", sektor: "Üretim", personel: 85 },
];

const TESVIK_LISTESI = [
  {
    id: "5510", kod: "5510", baslik: "Hazine Desteği (%5)", renk: C.basari, aylikDestek: 1250,
    aciklama: "Tüm özel sektör işverenlerine sağlanan temel SGK prim desteğidir.",
    sartlar: ["Borçsuzluk", "Aylık Prim Bildirgesi", "Yasal Sürede Ödeme"],
    kontrol: (f: any) => ({ uygun: true, durum: "UYGUN", not: "Borç kaydı bulunamadı, %5 indirim aktif." })
  },
  {
    id: "6111", kod: "6111", baslik: "Genç & Kadın İstihdamı", renk: C.bilgi, aylikDestek: 4850,
    aciklama: "İlave istihdam edilen genç ve kadın çalışanlar için sağlanan prim desteği.",
    sartlar: ["Son 6 Ay Ortalamaya İlave", "İşkur Kaydı", "18-29 Yaş Erkek / +18 Kadın"],
    kontrol: (f: any) => f.id === 2 ? ({ uygun: true, durum: "UYGUN", not: "8 yeni personel bu kapsamda değerlendirilebilir." }) : ({ uygun: false, durum: "ADAY YOK", not: "İlave istihdam şartı sağlanmıyor." })
  },
  {
    id: "17103", kod: "17103", baslik: "Bilişim & İmalat Desteği", renk: C.mor, aylikDestek: 14500,
    aciklama: "Stratejik sektörlerdeki ilave istihdam için yüksek tutarlı prim desteği.",
    sartlar: ["Bilişim veya İmalat Sektörü", "Ortalamaya İlave", "Maks. Brüt Ücret Sınırı"],
    kontrol: (f: any) => f.sektor === "Yazılım" ? ({ uygun: true, durum: "UYGUN", not: "Sektörel kod uyumlu, 3 yazılımcı için başvuru yapılabilir." }) : ({ uygun: false, durum: "KAPSAM DIŞI", not: "Sektörel faaliyet kodu bu teşvike uygun değil." })
  }
];

function SGKTesvik() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { label: "Toplam Aylık Tasarruf", deger: "₺142.500", renk: C.basari, ikon: "💰" },
          { label: "Aktif Teşvik", deger: "3", renk: C.bilgi, ikon: "✅" },
          { label: "Portföydeki Firma", deger: `${FIRMALAR.length}`, renk: C.mor, ikon: "🏢" },
        ].map((k, i) => (
          <div key={i} style={{ background: C.kart, border: `1px solid ${C.sinir}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{k.ikon}</span>
            <div>
              <div style={{ fontSize: 10, color: C.ucuncu, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: k.renk }}>{k.deger}</div>
            </div>
          </div>
        ))}
      </div>

      {TESVIK_LISTESI.map(tesvik => (
        <div key={tesvik.id} style={{ background: C.kart, borderRadius: 14, border: `1px solid ${C.sinir}`, overflow: "hidden" }}>
          <div style={{ background: tesvik.renk, padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.07em" }}>{tesvik.kod} SAYILI TEŞVİK</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginTop: 2 }}>{tesvik.baslik}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>₺{tesvik.aylikDestek.toLocaleString("tr-TR")}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)" }}>kişi başı / ay</div>
            </div>
          </div>
          <div style={{ padding: "10px 18px", borderBottom: `1px solid ${C.sinir}`, fontSize: 13, color: C.ikinci }}>
            {tesvik.aciklama}
            <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
              {tesvik.sartlar.map((s, i) => <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: C.bg, borderRadius: 6, color: C.ikinci }}>• {s}</span>)}
            </div>
          </div>
          {FIRMALAR.map((firma, i) => {
            const sonuc = tesvik.kontrol(firma);
            return (
              <div key={firma.id} style={{ padding: "12px 18px", borderBottom: i < FIRMALAR.length - 1 ? `1px solid ${C.sinir}` : "none", display: "flex", alignItems: "center", gap: 14, borderLeft: `4px solid ${sonuc.uygun ? tesvik.renk : C.sinir}`, background: sonuc.uygun ? tesvik.renk + "04" : C.kart }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: sonuc.uygun ? tesvik.renk + "18" : C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: sonuc.uygun ? tesvik.renk : C.ucuncu, flexShrink: 0 }}>{firma.ad.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.metin }}>{firma.ad}</div>
                  <div style={{ fontSize: 11, color: C.ucuncu }}>{firma.statu} · {firma.sektor} · {firma.personel} çalışan</div>
                  <div style={{ fontSize: 12, color: C.ikinci, marginTop: 3 }}>→ {sonuc.not}</div>
                </div>
                <Badge label={sonuc.durum} renk={sonuc.uygun ? tesvik.renk : C.ucuncu} />
              </div>
            );
          })}
        </div>
      ))}

      <div style={{ background: C.koyu, borderRadius: 14, padding: "18px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: C.kritik, letterSpacing: "0.07em", marginBottom: 8 }}>⚡ STRATEJİST NOTU</div>
        <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.75, margin: 0 }}>
          "Mart ayında yapılacak hatalı bir SGK meslek kodu bildirimi veya eksik gün, ileride yapılacak bir denetimde 5 yıllık geriye dönük İPC riski oluşturabilir. Özellikle '01-İstirahat' kodlu eksik günlerde vizite sistemindeki onayları kontrol etmeyi unutmayın."
        </p>
      </div>
    </div>
  );
}

/* ── ANA SAYFA ── */
const ARACLAR = [
  { id: "amor", ikon: "🏭", baslik: "Amortisman Hesabı", renk: C.turuncu, aciklama: "Normal & Azalan Bakiyeler yöntemi, yıllık tablo", Bilesen: Amortisman },
  { id: "rees", ikon: "📄", baslik: "Reeskont Faizi", renk: C.cyan, aciklama: "İç & Dış iskonto, TCMB oranı ile hesaplama", Bilesen: Reeskont },
  { id: "kidem", ikon: "👷", baslik: "Kıdem Tazminatı", renk: C.mor, aciklama: "Tavan kontrolü, damga vergisi, giydirilmiş ücret", Bilesen: KidemTazminati },
  { id: "gecik", ikon: "⏰", baslik: "Gecikme Zammı & Faiz", renk: C.kritik, aciklama: "Vergi faizi, gecikme zammı, temerrüt, yasal faiz", Bilesen: GecikmeFaizi },
  { id: "kira", ikon: "🏢", baslik: "Kira Artış Oranı", renk: C.basari, aciklama: "TÜFE & ÜFE bazlı, TBK Md.344 uyumlu hesaplama", Bilesen: KiraArtisi },
  { id: "ydeg", ikon: "📊", baslik: "Yeniden Değerleme", renk: C.bilgi, aciklama: "VUK yeniden değerleme oranı, 522 hesap hesaplama", Bilesen: YenidenDegerleme },
  { id: "kdv", ikon: "🧾", baslik: "KDV Hesaplamaları", renk: C.uyari, aciklama: "Dahil/Hariç dönüşüm, Özel matrah, Tevkifat oranı", Bilesen: KDVHesap },
  { id: "finans", ikon: "📈", baslik: "Finansal Durum", renk: C.mor, aciklama: "Bilanço, Gelir Tablosu ve Rasyo Analizi Merkezi", Bilesen: FinansalDurum },
  { id: "sgk", ikon: "🛡️", baslik: "SGK Teşvik Raporu", renk: C.basari, aciklama: "5510, 6111 ve 17103 teşvikleri için firma bazlı analiz", Bilesen: SGKTesvik },
];

// ─────────────────────────────────────────────
// 8. BEYANNAME TAKİBİ
// ─────────────────────────────────────────────
function BeyannameTakibi({ companies = [] }: { companies?: CompanyProfile[] }) {
  const [activeTab, setActiveTab] = useState("genel"); // "genel" or "firma"
  const [firms, setFirms] = useState<any[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('beyanname_firms');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Update names if companies changed but keep statuses
      if (companies.length > 0) {
        const updated = companies.map(c => {
          const existing = parsed.find((p: any) => p.id === c.id);
          return existing ? { ...existing, name: c.title } : {
            id: c.id,
            name: c.title,
            kdv: "Bekliyor",
            muhtasar: "Bekliyor",
            gecici: "Bekliyor",
            berat: "Bekliyor",
            notes: ""
          };
        });
        setFirms(updated);
      } else {
        setFirms(parsed);
      }
    } else if (companies.length > 0) {
      const initialFirms = companies.map(c => ({
        id: c.id,
        name: c.title,
        kdv: "Bekliyor",
        muhtasar: "Bekliyor",
        gecici: "Bekliyor",
        berat: "Bekliyor",
        notes: ""
      }));
      setFirms(initialFirms);
      localStorage.setItem('beyanname_firms', JSON.stringify(initialFirms));
    }
  }, [companies]);

  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem('beyanname_firms');
      if (stored) setFirms(JSON.parse(stored));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (firms.length > 0) {
      localStorage.setItem('beyanname_firms', JSON.stringify(firms));
    }
  }, [firms]);

  const [selectedFirmId, setSelectedFirmId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const statusColors: any = {
    "Verildi": { bg: C.yesil + "15", text: C.yesil, icon: <CheckCircle2 size={12} /> },
    "Bekliyor": { bg: C.sari + "15", text: C.sari, icon: <Clock size={12} /> },
    "Gecikti": { bg: C.kirmizi + "15", text: C.kirmizi, icon: <AlertCircle size={12} /> },
    "-": { bg: C.sinir + "30", text: C.ucuncu, icon: null },
    "İlgisiz": { bg: C.sinir + "30", text: C.ucuncu, icon: null },
  };

  const cycleStatus = (firmId: number, field: string) => {
    const cycle = ["Verildi", "Bekliyor", "Gecikti", "-"];
    setFirms(prev => prev.map(f => {
      if (f.id === firmId) {
        const currentStatus = (f as any)[field];
        const currentIndex = cycle.indexOf(currentStatus);
        const nextIndex = (currentIndex + 1) % cycle.length;
        return { ...f, [field]: cycle[nextIndex] };
      }
      return f;
    }));
  };

  const selectedFirm = firms.find(f => f.id === selectedFirmId);

  const handleAddNote = () => {
    if (!selectedFirmId || !noteInput.trim()) return;
    setFirms(prev => prev.map(f => {
      if (f.id === selectedFirmId) {
        return { ...f, notes: f.notes ? f.notes + "\n" + noteInput : noteInput };
      }
      return f;
    }));
    setNoteInput("");
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => setActiveTab("genel")}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "genel" ? 'border-kilim-blue text-kilim-blue' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Genel Takip Çizelgesi
        </button>
        <button 
          onClick={() => setActiveTab("firma")}
          className={`px-6 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === "firma" ? 'border-kilim-blue text-kilim-blue' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
        >
          Firma Bazlı Görünüm & Notlar
        </button>
      </div>

      {activeTab === "genel" ? (
        <div className="space-y-6">
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3">
            <AlertCircle className="text-rose-500" />
            <span className="text-rose-700 font-bold text-sm">DİKKAT: 3 firmanın berat yükleme süresi bugün doluyor!</span>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Firma Adı</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">KDV</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">MUHSGK</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">GEÇİCİ VERGİ</th>
                    <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-BERAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {firms.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{f.name}</span>
                          <span className="text-[10px] text-slate-400">Vergi No: 1234567890</span>
                        </div>
                      </td>
                      {["kdv", "muhtasar", "gecici", "berat"].map((field) => {
                        const status = (f as any)[field];
                        const config = statusColors[status] || statusColors["-"];
                        return (
                          <td key={field} className="p-4">
                            <button 
                              onClick={() => cycleStatus(f.id, field)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all hover:scale-105 active:scale-95 w-full justify-center"
                              style={{ background: config.bg, color: config.text }}
                            >
                              {config.icon}
                              {status}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Firm List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm px-2">Firmalar</h3>
            {firms.map(f => (
              <button 
                key={f.id}
                onClick={() => setSelectedFirmId(f.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${selectedFirmId === f.id ? 'bg-kilim-blue text-white border-kilim-blue shadow-lg shadow-kilim-blue/20' : 'bg-white border-slate-100 text-slate-600 hover:border-kilim-blue/30'}`}
              >
                <div className="font-bold text-sm">{f.name}</div>
                <div className={`text-[10px] mt-1 ${selectedFirmId === f.id ? 'text-white/70' : 'text-slate-400'}`}>
                  Son Güncelleme: Bugün 10:30
                </div>
              </button>
            ))}
          </div>

          {/* Firm Details & Notes */}
          <div className="lg:col-span-8">
            {selectedFirm ? (
              <div className="space-y-6">
                <div className="glass-card p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-800">{selectedFirm.name}</h2>
                      <p className="text-xs text-slate-500">Beyanname Detayları ve Özel Notlar</p>
                    </div>
                    <Badge label="AKTİF" renk={C.yesil} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: "KDV", status: selectedFirm.kdv },
                      { label: "MUHSGK", status: selectedFirm.muhtasar },
                      { label: "GEÇİCİ", status: selectedFirm.gecici },
                      { label: "BERAT", status: selectedFirm.berat },
                    ].map(item => (
                      <div key={item.label} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">{item.label}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: statusColors[item.status]?.text || C.sinir }} />
                          <span className="font-bold text-slate-700 text-sm">{item.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <FileText size={16} className="text-kilim-blue" />
                      Firma Notları
                    </h4>
                    <div className="bg-slate-50 rounded-2xl p-4 min-h-[150px] border border-slate-100">
                      {selectedFirm.notes ? (
                        <div className="space-y-3">
                          {selectedFirm.notes.split('\n').map((note, i) => (
                            <div key={i} className="flex gap-3 text-sm text-slate-600 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                              <div className="w-1 h-full bg-kilim-blue rounded-full" />
                              {note}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm italic">Bu firma için henüz bir not eklenmemiş.</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="Yeni not ekleyin..." 
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                      />
                      <button 
                        onClick={handleAddNote}
                        className="bg-kilim-blue text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-kilim-blue-dark transition-all"
                      >
                        Ekle
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Firma Seçilmedi</h3>
                  <p className="text-sm text-slate-400">Detayları ve notları görmek için soldan bir firma seçin.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 9. CARİ HESAP & TAHSİLAT
// ─────────────────────────────────────────────
function CariHesapTahsilat({ companies = [] }: { companies?: CompanyProfile[] }) {
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    customerId: "",
    amount: "",
    type: "Tahsilat",
    desc: ""
  });

  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    if (companies.length > 0) {
      setCustomers(companies.map(c => ({
        id: c.id,
        name: c.title,
        balance: 0,
        overdue: 0,
        status: "Normal",
        history: []
      })));
    }
  }, [companies]);

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.customerId || !paymentForm.amount) return;

    const amountNum = parseFloat(paymentForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newHistoryItem = {
      date: new Date().toLocaleDateString('tr-TR'),
      type: paymentForm.type,
      amount: amountNum,
      desc: paymentForm.desc || (paymentForm.type === 'Tahsilat' ? 'Tahsilat İşlemi' : 'Fatura Girişi')
    };

    setCustomers(prev => prev.map(c => {
      if (c.id === paymentForm.customerId) {
        const newBalance = paymentForm.type === 'Tahsilat' 
          ? c.balance - amountNum
          : c.balance + amountNum;
        
        return {
          ...c,
          balance: newBalance,
          history: [newHistoryItem, ...c.history],
          status: newBalance > 100000 ? "Kritik" : newBalance < 0 ? "Alacaklı" : "Normal"
        };
      }
      return c;
    }));

    setIsPaymentModalOpen(false);
    setPaymentForm({ customerId: "", amount: "", type: "Tahsilat", desc: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-kilim-blue-dark">Cari Hesap & Tahsilat Takibi</h2>
        <button 
          onClick={() => setIsPaymentModalOpen(true)}
          className="bg-kilim-blue text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-kilim-blue-dark transition-colors shadow-lg shadow-kilim-blue/20"
        >
          <Plus size={18} /> Ödeme Girişi Yap
        </button>
      </div>

      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-kilim-blue-dark">Yeni Ödeme Girişi</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Firma Seçin</label>
                <select 
                  value={paymentForm.customerId}
                  onChange={e => setPaymentForm({...paymentForm, customerId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                  required
                >
                  <option value="">Seçiniz...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">İşlem Tipi</label>
                  <select 
                    value={paymentForm.type}
                    onChange={e => setPaymentForm({...paymentForm, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                  >
                    <option value="Tahsilat">Tahsilat (Alacak Azalır)</option>
                    <option value="Fatura">Fatura (Alacak Artar)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tutar (₺)</label>
                  <input 
                    type="number" 
                    value={paymentForm.amount}
                    onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Açıklama</label>
                <input 
                  type="text" 
                  value={paymentForm.desc}
                  onChange={e => setPaymentForm({...paymentForm, desc: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-kilim-blue/20 outline-none"
                  placeholder="Örn: Banka Havalesi"
                />
              </div>
              <button type="submit" className="w-full bg-kilim-blue text-white py-4 rounded-2xl font-bold hover:bg-kilim-blue-dark transition-all shadow-lg shadow-kilim-blue/20 mt-4">
                Kaydet
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 border-l-4 border-kilim-blue">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Toplam Alacak</p>
          <p className="text-2xl font-black text-kilim-blue">{para(customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0))}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-rose-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gecikmiş Alacak</p>
          <p className="text-2xl font-black text-rose-500">{para(customers.reduce((acc, c) => acc + c.overdue, 0))}</p>
        </div>
        <div className="glass-card p-6 border-l-4 border-emerald-500">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahsilat Oranı</p>
          <p className="text-2xl font-black text-emerald-500">
            {customers.length > 0 ? "%100" : "%0"}
          </p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Müşteri / Firma</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bakiye</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gecikmiş</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Durum</th>
              <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group">
                <td className="p-4" onClick={() => setSelectedCustomer(c)}>
                  <span className="font-bold text-slate-800 text-sm group-hover:text-kilim-blue transition-colors">{c.name}</span>
                </td>
                <td className="p-4" onClick={() => setSelectedCustomer(c)}>
                  <span className={`font-bold text-sm ${c.balance < 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                    {para(Math.abs(c.balance))} {c.balance < 0 ? '(A)' : '(B)'}
                  </span>
                </td>
                <td className="p-4" onClick={() => setSelectedCustomer(c)}>
                  <span className={`font-bold text-sm ${c.overdue > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {para(c.overdue)}
                  </span>
                </td>
                <td className="p-4" onClick={() => setSelectedCustomer(c)}>
                  <Badge label={c.status} renk={c.status === 'Kritik' ? C.kirmizi : c.status === 'Alacaklı' ? C.yesil : C.mavi} />
                </td>
                <td className="p-4">
                  <button 
                    onClick={() => setSelectedCustomer(c)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-kilim-blue transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedCustomer && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-6 border-t-4 border-kilim-blue"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{selectedCustomer.name}</h3>
                <p className="text-xs text-slate-500">Ödeme ve Tahsilat Geçmişi</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedCustomer.history.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-100">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="p-3 font-bold text-slate-500 uppercase text-[10px]">Tarih</th>
                        <th className="p-3 font-bold text-slate-500 uppercase text-[10px]">İşlem</th>
                        <th className="p-3 font-bold text-slate-500 uppercase text-[10px]">Açıklama</th>
                        <th className="p-3 font-bold text-slate-500 uppercase text-[10px]">Tutar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedCustomer.history.map((h: any, i: number) => (
                        <tr key={i}>
                          <td className="p-3 text-slate-600">{h.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${h.type === 'Tahsilat' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                              {h.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500">{h.desc}</td>
                          <td className={`p-3 font-bold ${h.type === 'Tahsilat' ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {h.type === 'Tahsilat' ? '-' : '+'}{para(h.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm text-slate-400">Bu firma için henüz bir işlem geçmişi bulunmuyor.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// 10. MÜŞTERİ İLETİŞİM & BİLDİRİM
// ─────────────────────────────────────────────
function MusteriIletisim({ companies = [] }: { companies?: CompanyProfile[] }) {
  const [selectedFirm, setSelectedFirm] = useState(companies.length > 0 ? companies[0].title : "");

  useEffect(() => {
    if (companies.length > 0 && !selectedFirm) {
      setSelectedFirm(companies[0].title);
    }
  }, [companies]);
  const templates = [
    { id: 1, title: "Evrak Talebi", content: "Sayın {firma}, {ay} dönemine ait mizan ve faturalarınızı beklemekteyiz." },
    { id: 2, title: "Ödeme Hatırlatma", content: "Sayın {firma}, {tutar} tutarındaki gecikmiş bakiyenizin ödenmesini rica ederiz." },
    { id: 3, title: "Beyanname Bildirimi", content: "Sayın {firma}, {ay} dönemi KDV beyannameniz verilmiştir. Tahakkuk fişi ektedir." },
    { id: 4, title: "Genel Hatırlatma", content: "Sayın {firma}, yarın yapılacak olan toplantı saat 14:00'e alınmıştır." },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <div className="glass-card p-4">
          <h3 className="font-bold text-slate-800 text-sm mb-4">Firmalar</h3>
          <div className="space-y-2">
            {companies.map(c => (
              <button 
                key={c.id}
                onClick={() => setSelectedFirm(c.title)}
                className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all ${selectedFirm === c.title ? 'bg-kilim-red text-white shadow-lg shadow-kilim-red/20' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                {c.title}
              </button>
            ))}
            {companies.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4 italic">Kayıtlı firma bulunamadı.</p>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        <div className="glass-card flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-kilim-blue/10 flex items-center justify-center text-kilim-blue font-bold">
                {selectedFirm ? selectedFirm[0] : "?"}
              </div>
              <div>
                <h4 className="font-bold text-kilim-blue-dark text-sm">{selectedFirm || "Firma Seçilmedi"}</h4>
                {selectedFirm && <span className="text-[10px] text-emerald-500 font-bold">● Çevrimiçi</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"><MessageCircle size={20} /></button>
              <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"><Mail size={20} /></button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/30">
            {!selectedFirm ? (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                Mesajlaşmak için bir firma seçin.
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                Henüz mesaj geçmişi bulunmuyor.
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {templates.map(t => (
                <button key={t.id} className="whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-kilim-red hover:text-white transition-all">
                  {t.title}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Mesajınızı yazın..." 
                className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-kilim-red/20 outline-none"
              />
              <button className="bg-kilim-red text-white p-2 rounded-xl hover:bg-kilim-red-dark transition-colors">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 11. PERSONEL & BORDRO (REDESIGN)
// ─────────────────────────────────────────────

function PersonelBordro({ companies = [] }: { companies?: CompanyProfile[] }) {
  const [secilenFirmaId, setSecilenFirmaId] = useState<string>(companies.length > 0 ? companies[0].id : "");
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  useEffect(() => {
    if (companies.length > 0 && !secilenFirmaId) {
      setSecilenFirmaId(companies[0].id);
    }
  }, [companies]);

  useEffect(() => {
    const selectedCompany = companies.find(c => c.id === secilenFirmaId);
    if (selectedCompany && selectedCompany.personnel) {
      setPersonnel(selectedCompany.personnel.map(p => ({
        ...p,
        firmaId: selectedCompany.id,
        ad: p.fullName,
        tc: p.idNumber,
        gorev: p.role,
        brut: p.netSalary * 1.4, // Basit bir brüt tahmini
        giris: p.startDate,
        durum: p.leaveStatus,
        izinHak: 14,
        izinKul: 0,
        sgkNo: p.idNumber,
        tesvik: "5510",
        tesvikBitis: "2026-12-31"
      })));
    } else {
      setPersonnel([]);
    }
  }, [secilenFirmaId, companies]);

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<any>(null);
  const [leaveDays, setLeaveDays] = useState(1);

  const firmaPersonel = personnel.filter(p => p.firmaId === secilenFirmaId);

  const hesaplaBordro = (brut: number) => {
    const sgkIsci = brut * 0.14;
    const issizlikIsci = brut * 0.01;
    const gelirVergisiMatrahi = brut - (sgkIsci + issizlikIsci);
    const gelirVergisi = gelirVergisiMatrahi * 0.15;
    const damgaVergisi = brut * 0.00759;
    const net = brut - (sgkIsci + issizlikIsci + gelirVergisi + damgaVergisi);
    const sgkIsveren = brut * 0.155;
    const issizlikIsveren = brut * 0.02;
    const toplamMaliyet = brut + sgkIsveren + issizlikIsveren;
    return { net, sgkIsci, gelirVergisi, damgaVergisi, sgkIsveren, toplamMaliyet };
  };

  const kidemYilHesapla = (giris: string) => {
    const diff = new Date().getTime() - new Date(giris).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const handleLeaveSubmit = () => {
    if (!leaveTarget) return;
    setPersonnel(prev => prev.map(p => 
      p.id === leaveTarget.id ? { ...p, izinKul: p.izinKul + leaveDays } : p
    ));
    setShowLeaveModal(false);
    setLeaveTarget(null);
  };

  const toplamBrut = firmaPersonel.reduce((acc, p) => acc + p.brut, 0);
  const toplamNet = firmaPersonel.reduce((acc, p) => acc + hesaplaBordro(p.brut).net, 0);
  const toplamMaliyet = firmaPersonel.reduce((acc, p) => acc + hesaplaBordro(p.brut).toplamMaliyet, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 40 }}>
      {/* Üst Kontrol */}
      <div style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        background: C.kart, padding: 24, borderRadius: 20, border: `1px solid ${C.sinir}` 
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: C.koyu, margin: 0 }}>Personel & Bordro</h2>
          <p style={{ fontSize: 13, color: C.ikinci, margin: "4px 0 0 0" }}>Firma bazlı personel yönetimi</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: C.ucuncu, uppercase: "true" } as any}>Firma:</span>
          <select 
            value={secilenFirmaId}
            onChange={(e) => setSecilenFirmaId(e.target.value)}
            style={{ 
              padding: "10px 16px", borderRadius: 12, border: `1px solid ${C.sinir}`, 
              background: C.bg, color: C.mavi, fontWeight: 700, outline: "none", cursor: "pointer" 
            }}
          >
            {companies.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
            {companies.length === 0 && <option value="">Firma Yok</option>}
          </select>
        </div>
      </div>

      {/* KPI Kartları */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
        <div style={{ background: C.kart, padding: 20, borderRadius: 16, borderLeft: `5px solid ${C.mavi}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: C.maviSoluk, display: "flex", alignItems: "center", justifyContent: "center", color: C.mavi }}><Users size={24} /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.ucuncu, textTransform: "uppercase" }}>Toplam Personel</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.metin }}>{firmaPersonel.length} <span style={{ fontSize: 13, fontWeight: 400, color: C.ikinci }}>Kişi</span></div>
            </div>
          </div>
        </div>
        <div style={{ background: C.kart, padding: 20, borderRadius: 16, borderLeft: `5px solid ${C.yesil}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: C.yesil + "15", display: "flex", alignItems: "center", justifyContent: "center", color: C.yesil }}><ShieldCheck size={24} /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.ucuncu, textTransform: "uppercase" }}>Aktif Çalışan</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.metin }}>{firmaPersonel.filter(p => p.durum === 'Aktif').length} <span style={{ fontSize: 13, fontWeight: 400, color: C.ikinci }}>Kişi</span></div>
            </div>
          </div>
        </div>
        <div style={{ background: C.kart, padding: 20, borderRadius: 16, borderLeft: `5px solid ${C.kirmizi}`, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: C.kirmizi + "15", display: "flex", alignItems: "center", justifyContent: "center", color: C.kirmizi }}><TrendingUp size={24} /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.ucuncu, textTransform: "uppercase" }}>Toplam Maliyet</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: C.kirmizi }}>{para(toplamMaliyet)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Personel Tablosu */}
      <div style={{ background: C.kart, borderRadius: 20, border: `1px solid ${C.sinir}`, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: C.mavi }}>
                <th style={{ padding: "16px 20px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>Ad Soyad / Görev</th>
                <th style={{ padding: "16px 20px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>TC / SGK No</th>
                <th style={{ padding: "16px 20px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>Net Maaş</th>
                <th style={{ padding: "16px 20px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>Kıdem</th>
                <th style={{ padding: "16px 20px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>İzin Durumu</th>
                <th style={{ padding: "16px 20px", fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.75)", textTransform: "uppercase" }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {firmaPersonel.map(p => {
                const isExpanded = expandedId === p.id;
                const payroll = hesaplaBordro(p.brut);
                const kidem = kidemYilHesapla(p.giris);
                const kalanIzin = p.izinHak - p.izinKul;

                return (
                  <React.Fragment key={p.id}>
                    <tr style={{ 
                      borderBottom: `1px solid ${C.sinir}`, 
                      background: isExpanded ? C.maviSoluk : "transparent",
                      transition: "background 0.2s"
                    }}>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👤</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: C.metin }}>{p.ad}</div>
                            <div style={{ fontSize: 10, color: C.ucuncu, fontWeight: 600 }}>{p.gorev}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 12, fontFamily: "monospace", color: C.ikinci }}>{p.tc}</div>
                        <div style={{ fontSize: 10, color: C.ucuncu }}>SGK: {p.sgkNo}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: C.mavi }}>{para(payroll.net)}</div>
                        <div style={{ fontSize: 10, color: C.ucuncu }}>Brüt: {para(p.brut)}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <Badge label={`${kidem} Yıl`} renk={kidem > 5 ? C.kirmizi : C.mavi} />
                        <div style={{ fontSize: 10, color: C.ucuncu, marginTop: 4 }}>{p.giris}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ width: 100 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 800, color: C.ucuncu, textTransform: "uppercase", marginBottom: 4 }}>
                            <span>Kalan</span>
                            <span>{kalanIzin} G</span>
                          </div>
                          <div style={{ height: 6, background: C.sinir, borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(kalanIzin / p.izinHak) * 100}%`, background: kalanIzin < 5 ? C.kirmizi : C.yesil, borderRadius: 10 }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : p.id)}
                          style={{ 
                            padding: 8, borderRadius: 10, border: "none", cursor: "pointer",
                            background: isExpanded ? C.mavi : C.bg, color: isExpanded ? "#FFF" : C.ucuncu,
                            display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s"
                          }}
                        >
                          <ChevronDown size={18} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.3s" }} />
                        </button>
                      </td>
                    </tr>
                    
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ padding: 0, background: C.bg + "50" }}>
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: "hidden" }}
                          >
                            <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                              {/* Bordro Detayı */}
                              <div style={{ background: "#FFF", padding: 20, borderRadius: 16, border: `1px solid ${C.sinir}` }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: C.metin, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                  <Calculator size={14} color={C.mavi} /> Maaş & Vergi Dökümü
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingBottom: 8, borderBottom: `1px solid ${C.bg}` }}>
                                    <span style={{ color: C.ikinci }}>SGK İşçi Payı (%14)</span>
                                    <span style={{ fontWeight: 700, color: C.metin }}>{para(payroll.sgkIsci)}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingBottom: 8, borderBottom: `1px solid ${C.bg}` }}>
                                    <span style={{ color: C.ikinci }}>Gelir Vergisi (%15)</span>
                                    <span style={{ fontWeight: 700, color: C.metin }}>{para(payroll.gelirVergisi)}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingBottom: 8, borderBottom: `1px solid ${C.bg}` }}>
                                    <span style={{ color: C.ikinci }}>Damga Vergisi</span>
                                    <span style={{ fontWeight: 700, color: C.metin }}>{para(payroll.damgaVergisi)}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, paddingBottom: 8, borderBottom: `1px solid ${C.bg}` }}>
                                    <span style={{ color: C.ikinci }}>SGK İşveren Payı (%15.5)</span>
                                    <span style={{ fontWeight: 700, color: C.yesil }}>{para(payroll.sgkIsveren)}</span>
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 900, paddingTop: 8 }}>
                                    <span style={{ color: C.metin }}>Toplam Maliyet</span>
                                    <span style={{ color: C.kirmizi }}>{para(payroll.toplamMaliyet)}</span>
                                  </div>
                                </div>
                              </div>

                              {/* İzin Yönetimi */}
                              <div style={{ background: "#FFF", padding: 20, borderRadius: 16, border: `1px solid ${C.sinir}` }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: C.metin, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                  <Calendar size={14} color={C.mavi} /> İzin & Devamsızlık
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                                  <div style={{ background: C.bg, padding: 12, borderRadius: 12, textAlign: "center" }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: C.ucuncu, textTransform: "uppercase" }}>Hakedilen</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: C.metin }}>{p.izinHak}</div>
                                  </div>
                                  <div style={{ background: C.bg, padding: 12, borderRadius: 12, textAlign: "center" }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, color: C.ucuncu, textTransform: "uppercase" }}>Kullanılan</div>
                                    <div style={{ fontSize: 18, fontWeight: 900, color: C.mavi }}>{p.izinKul}</div>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => { setLeaveTarget(p); setShowLeaveModal(true); }}
                                  style={{ 
                                    width: "100%", padding: 12, background: C.mavi, color: "#FFF", 
                                    borderRadius: 12, border: "none", fontSize: 12, fontWeight: 700, 
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                                  }}
                                >
                                  <Plus size={16} /> İzin Girişi Yap
                                </button>
                              </div>

                              {/* Teşvik Bilgisi */}
                              <div style={{ background: "#FFF", padding: 20, borderRadius: 16, border: `1px solid ${C.sinir}` }}>
                                <div style={{ fontSize: 11, fontWeight: 900, color: C.metin, textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                                  <Zap size={14} color={C.mavi} /> SGK Teşvik Bilgisi
                                </div>
                                <div style={{ background: C.yesil + "10", padding: 16, borderRadius: 12, border: `1px solid ${C.yesil}20` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: C.yesil }}>Aktif Teşvik:</span>
                                    <Badge label={p.tesvik} renk={C.yesil} />
                                  </div>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 10, fontWeight: 800, color: C.yesil }}>Bitiş Tarihi:</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: C.metin }}>{p.tesvikBitis}</span>
                                  </div>
                                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.yesil}20`, fontSize: 10, color: C.yesilAcik, fontStyle: "italic" }}>
                                    Bu personel için aylık yaklaşık {para(4850)} tutarında SGK teşviği uygulanmaktadır.
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: C.mavi }}>
                <td style={{ padding: "16px 20px", fontSize: 12, fontWeight: 900, color: "#FFF" }}>TOPLAM ({firmaPersonel.length} Personel)</td>
                <td style={{ padding: "16px 20px" }}></td>
                <td style={{ padding: "16px 20px", fontSize: 12, fontWeight: 900, color: "#FFF" }}>
                  <div>Net: {para(toplamNet)}</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>Brüt: {para(toplamBrut)}</div>
                </td>
                <td style={{ padding: "16px 20px" }}></td>
                <td style={{ padding: "16px 20px" }}></td>
                <td style={{ padding: "16px 20px", fontSize: 14, fontWeight: 900, color: "#FFF", textAlign: "right" }}>{para(toplamMaliyet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* İzin Modalı */}
      <AnimatePresence>
        {showLeaveModal && (
          <div style={{ 
            position: "fixed", inset: 0, zIndex: 1000, display: "flex", 
            alignItems: "center", justifyContent: "center", padding: 20 
          }}>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowLeaveModal(false)}
              style={{ position: "absolute", inset: 0, background: "rgba(28,20,16,0.6)", backdropFilter: "blur(4px)" }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={{ 
                position: "relative", background: "#FFF", width: "100%", maxWidth: 400, 
                borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" 
              }}
            >
              <div style={{ padding: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: C.metin, margin: 0 }}>İzin Girişi</h3>
                  <button onClick={() => setShowLeaveModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.ucuncu }}><X size={20} /></button>
                </div>
                
                <div style={{ background: C.bg, padding: 16, borderRadius: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: C.ucuncu, textTransform: "uppercase", fontWeight: 800 }}>Personel</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.metin, marginTop: 4 }}>{leaveTarget?.ad}</div>
                  <div style={{ fontSize: 11, color: C.mavi, fontWeight: 800, marginTop: 4 }}>Kalan İzin: {leaveTarget?.izinHak - leaveTarget?.izinKul} Gün</div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: C.ucuncu, textTransform: "uppercase", display: "block", marginBottom: 12 }}>Kullanılacak Gün Sayısı</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button 
                      onClick={() => setLeaveDays(Math.max(1, leaveDays - 1))}
                      style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: C.bg, fontSize: 20, fontWeight: 900, cursor: "pointer", color: C.metin }}
                    >-</button>
                    <div style={{ flex: 1, textAlign: "center", fontSize: 24, fontWeight: 900, color: C.mavi }}>{leaveDays}</div>
                    <button 
                      onClick={() => setLeaveDays(Math.min(leaveTarget?.izinHak - leaveTarget?.izinKul, leaveDays + 1))}
                      style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: C.bg, fontSize: 20, fontWeight: 900, cursor: "pointer", color: C.metin }}
                    >+</button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button 
                    onClick={() => setShowLeaveModal(false)}
                    style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", background: C.bg, color: C.ikinci, fontWeight: 700, cursor: "pointer" }}
                  >İptal</button>
                  <button 
                    onClick={handleLeaveSubmit}
                    style={{ flex: 2, padding: 14, borderRadius: 14, border: "none", background: C.mavi, color: "#FFF", fontWeight: 700, cursor: "pointer", boxShadow: `0 8px 16px ${C.mavi}30` }}
                  >İzni Kaydet</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📢 AYIN KRİTİK NOTU */}
      <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        <div style={{ 
          background: C.kart, padding: 24, borderRadius: 24, border: `1px solid ${C.sinir}`, 
          borderLeft: `6px solid ${C.sari}`, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.maviSoluk, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={20} color={C.mavi} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: C.mavi, margin: 0, textTransform: "uppercase" }}>📢 AYIN KRİTİK NOTU (Mart 2026)</h3>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            <div style={{ background: C.bg, padding: 20, borderRadius: 20, border: `1px solid ${C.sinir}` }}>
              <p style={{ fontWeight: 800, color: C.metin, fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Activity size={16} color={C.yesil} /> Gün Hesaplama Kuralları
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: C.ikinci, display: "flex", flexDirection: "column", gap: 8 }}>
                <li><strong>Şubat Ayı (28 Gün):</strong> Eksik günü olmayan personel <strong>30 gün</strong> üzerinden bildirilir.</li>
                <li><strong>Eksik Gün Varsa:</strong> Formül <code>28 - Eksik Gün</code> şeklinde uygulanır.</li>
                <li><strong>31 Çeken Aylar:</strong> Eksik gün yoksa 30, varsa 31 gün üzerinden hesaplama yapılır.</li>
              </ul>
            </div>

            <div style={{ background: C.kirmizi + "08", padding: 20, borderRadius: 20, border: `1px solid ${C.kirmizi}20` }}>
              <p style={{ fontWeight: 800, color: C.kirmizi, fontSize: 13, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <ShieldAlert size={16} color={C.kirmizi} /> Yasal Süre & İPC Uyarıları
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: C.kirmizi, display: "flex", flexDirection: "column", gap: 8 }}>
                <li><strong>İşe Giriş:</strong> En geç çalışmaya başlamadan 1 gün önce.</li>
                <li><strong>İşten Çıkış:</strong> Ayrılış tarihinden itibaren en geç 10 gün içinde.</li>
                <li><strong>Süre Aşımı:</strong> Her bir bildirim için asgari ücret tutarında İPC riski!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 📋 İŞKUR VE PERİYODİK BİLDİRİMLER */}
        <div style={{ 
          background: C.kart, padding: 24, borderRadius: 24, border: `1px solid ${C.sinir}`, 
          boxShadow: "0 4px 12px rgba(0,0,0,0.03)" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.maviSoluk, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={20} color={C.mavi} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: C.mavi, margin: 0, textTransform: "uppercase" }}>📋 İŞKUR VE PERİYODİK BİLDİRİMLER</h3>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.yesil + "20", color: C.yesil, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckCircle2 size={14} /></div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: C.metin, margin: 0 }}>İŞKUR Aylık İşgücü Çizelgesi</p>
                  <p style={{ fontSize: 11, color: C.ikinci, marginTop: 4, lineHeight: 1.5 }}>10 ve üzeri işçi çalıştıran işletmeler için son gün <strong>31 Mart</strong>. Sisteme girilmeyen çizelgeler ileride teşvik yasaklılığına yol açabilir.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.yesil + "20", color: C.yesil, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckCircle2 size={14} /></div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: C.metin, margin: 0 }}>Engelli/Eski Hükümlü Kontenjanı</p>
                  <p style={{ fontSize: 11, color: C.ikinci, marginTop: 4, lineHeight: 1.5 }}>50 ve üzeri çalışanı olan işyerlerinde %3 engelli istihdam zorunluluğunu Mart ayı bordrosu öncesi kontrol edin.</p>
                </div>
              </div>
            </div>

            <div style={{ background: C.mavi, padding: 20, borderRadius: 20, color: "#FFF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <ShieldAlert size={16} color={C.sari} />
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: C.sari }}>Stratejist Notu</span>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
                "Mart ayı, yılın ilk çeyreğinin kapandığı aydır. Bu dönemde yapılacak hatalı bir SGK meslek kodu bildirimi veya eksik gün nedeni, ileride yapılacak bir denetimde 5 yıllık geriye dönük İPC riski oluşturabilir."
              </p>
            </div>
          </div>
        </div>

        {/* 🔔 Yasal Uyarı & Notlar */}
        <div style={{ background: C.kirmizi + "08", padding: 20, borderRadius: 24, border: `1px solid ${C.kirmizi}15` }}>
          <h4 style={{ fontSize: 13, fontWeight: 900, color: C.kirmizi, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={18} color={C.kirmizi} /> 🔔 Yasal Uyarı & Notlar
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.kirmizi, marginTop: 6, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: C.metin, margin: 0, lineHeight: 1.4 }}><strong>Resmi Tatil Mesaisi:</strong> Bayramlarda çalışılan her gün için personele <strong>+1 tam yevmiye</strong> ödenmelidir.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.kirmizi, marginTop: 6, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: C.metin, margin: 0, lineHeight: 1.4 }}><strong>Hafta Tatili:</strong> 6 gün çalışan işçinin 7. gün 24 saat kesintisiz dinlenme hakkı vardır.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.kirmizi, marginTop: 6, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: C.metin, margin: 0, lineHeight: 1.4 }}><strong>Normal Çalışma:</strong> Haftalık süre 45 saattir. Aşan her saat <strong>%50 zamlı</strong> ödenir.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 12. SGK TEŞVİK REDESIGN
// ─────────────────────────────────────────────
function SGKTesvikRedesign() {
  const reports = [
    { id: 1, title: "7103 Sayılı Teşvik Analizi", status: "Uyumlu", savings: 12500, date: "05.03.2026" },
    { id: 2, title: "6111 Sayılı Teşvik Analizi", status: "Kısmi Uyumlu", savings: 4200, date: "04.03.2026" },
    { id: 3, title: "Engelli İstihdam Teşviki", status: "Uyumlu", savings: 2800, date: "01.03.2026" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-kilim-dark text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-2">SGK Teşvik Uyumluluk Raporu</h2>
          <p className="text-slate-400 text-sm max-w-md">Firmanızın yararlanabileceği maksimum teşvik tutarlarını görüntüleyin.</p>
          <div className="mt-6 flex gap-4">
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Potansiyel Tasarruf</p>
              <p className="text-2xl font-black text-emerald-400">{para(19500)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Uyumlu Personel</p>
              <p className="text-2xl font-black text-blue-400">12 / 15</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-kilim-green/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(r => (
          <div key={r.id} className="glass-card p-6 space-y-4 hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-2xl bg-slate-50 group-hover:bg-kilim-green/10 transition-colors">
                <ShieldCheck className="text-kilim-green" />
              </div>
              <Badge label={r.status} renk={r.status === 'Uyumlu' ? C.yesil : C.sari} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{r.title}</h4>
              <p className="text-[10px] text-slate-400 mt-1">Son Analiz: {r.date}</p>
            </div>
            <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Aylık Kazanç</p>
                <p className="text-lg font-black text-kilim-green">{para(r.savings)}</p>
              </div>
              <button className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-kilim-green hover:bg-kilim-green/5 transition-all">
                <Download size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 bg-kilim-blue/5 border-kilim-blue/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-kilim-blue flex items-center justify-center text-white shadow-lg shadow-kilim-blue/20">
            <Zap size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 text-sm">Yeni Teşvik Analizi Başlat</h4>
            <p className="text-xs text-slate-500">Personel verilerinizi güncelleyerek en yeni SGK teşviklerinden yararlanıp yararlanmadığınızı kontrol edin.</p>
          </div>
          <button className="bg-kilim-blue text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-kilim-blue-dark transition-all shadow-md">
            Analizi Çalıştır
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 13. ANA MODÜL SARMALAYICI
// ─────────────────────────────────────────────
export const OfficeProductivityModule = ({ activeTab, companies = [] }: { activeTab: string, companies?: CompanyProfile[] }) => {
  const renderTool = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Panel />;
      case 'beyanname':
        return <BeyannameTakibi companies={companies} />;
      case 'cari-hesap':
        return <CariHesapTahsilat companies={companies} />;
      case 'musteri-iletisim':
        return <MusteriIletisim companies={companies} />;
      case 'personel-bordro':
        return <PersonelBordro companies={companies} />;
      case 'hesaplamalar':
      default:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
              <AracKarti ikon="🧾" baslik="KDV Hesaplamaları" renk={C.uyari}>
                <KDVHesap />
              </AracKarti>
              <AracKarti ikon="🏭" baslik="Amortisman Hesabı" renk={C.turuncu}>
                <Amortisman />
              </AracKarti>
              <AracKarti ikon="👷" baslik="Kıdem Tazminatı" renk={C.mor}>
                <KidemTazminati />
              </AracKarti>
              <AracKarti ikon="📉" baslik="Reeskont Faizi" renk={C.cyan}>
                <Reeskont />
              </AracKarti>
              <AracKarti ikon="🏢" baslik="Kira Artış Oranı" renk={C.basari}>
                <KiraArtisi />
              </AracKarti>
              <AracKarti ikon="⚖️" baslik="Gecikme Zammı & Faiz" renk={C.kritik}>
                <GecikmeFaizi />
              </AracKarti>
              <AracKarti ikon="📊" baslik="Yeniden Değerleme" renk={C.bilgi}>
                <YenidenDegerleme />
              </AracKarti>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderTool()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
