"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch, ArrowRightLeft, Grip, Archive,
  CircleDot, CheckCircle, XCircle,
  Plus, Check, X, Search,
} from "lucide-react";

export function DemoFormCreate() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1800);
    const t3 = setTimeout(() => setStep(3), 2600);
    const t4 = setTimeout(() => setStep(0), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [step]);

  const title = "Kayıt Formu";
  const displayed = step >= 1 ? title.slice(0, Math.min(title.length, Math.floor((step === 1 ? 1 : 1) * title.length))) : "";

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Demo</p>
      <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-2">
        <p className="text-[10px] text-neutral-600 mb-1">Form Başlığı</p>
        <div className="h-5 flex items-center">
          <motion.span className="text-xs text-neutral-200 font-medium" initial={{ opacity: 0 }} animate={{ opacity: step >= 1 ? 1 : 0 }}>
            {displayed}
          </motion.span>
          <motion.span className="ml-0.5 w-0.5 h-3.5 bg-skylab-400" animate={{ opacity: step >= 1 && step < 3 ? [1, 0] : 0 }} transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}/>
        </div>
      </div>
      <motion.div className="flex justify-end" animate={{ opacity: step >= 2 ? 1 : 0.3 }}>
        <motion.div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${step >= 3 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-skylab-500/15 text-skylab-300 border border-skylab-400/25"}`}
          animate={step >= 3 ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: 0.3 }}
        >
          {step >= 3 ? <Check size={10} /> : <Plus size={10} />}
          {step >= 3 ? "Oluşturuldu" : "Oluştur"}
        </motion.div>
      </motion.div>
    </div>
  );
}

export function DemoDragDrop() {
  const [items, setItems] = useState(["Kısa Metin", "Açılır Liste", "Toggle"]);
  const [dragging, setDragging] = useState(null);

  useEffect(() => {
    const t1 = setTimeout(() => setDragging(2), 800);
    const t2 = setTimeout(() => {
      setItems(["Kısa Metin", "Toggle", "Açılır Liste"]);
      setDragging(null);
    }, 2000);
    const t3 = setTimeout(() => {
      setItems(["Kısa Metin", "Açılır Liste", "Toggle"]);
    }, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [items[1]]);

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Sürükle & Bırak</p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <motion.div key={item} layout
            className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] transition-colors ${
              dragging === i ? "border-skylab-400/30 bg-skylab-500/10 text-skylab-300"
                : "border-white/8 bg-white/3 text-neutral-300"
            }`}
            animate={dragging === i ? { y: [0, -4, 0], x: [0, 2, 0] } : {}}
            transition={{ duration: 0.5 }}
          >
            <Grip size={10} className="text-neutral-600" />
            <span>{item}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function DemoConditional() {
  const [toggled, setToggled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setToggled(v => !v), 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Koşullu Gösterim</p>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-md border border-white/8 bg-white/3 px-2.5 py-1.5">
          <span className="text-[11px] text-neutral-300">Deneyiminiz var mı?</span>
          <motion.div
            className={`h-4 w-7 rounded-full p-0.5 cursor-pointer transition-colors ${toggled ? "bg-skylab-500" : "bg-neutral-700"}`}
            onClick={() => setToggled(v => !v)}
          >
            <motion.div
              className="h-3 w-3 rounded-full bg-white"
              animate={{ x: toggled ? 12 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </motion.div>
        </div>
        <AnimatePresence>
          {toggled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-md border border-skylab-400/20 bg-skylab-500/5 px-2.5 py-1.5">
                <GitBranch size={10} className="text-skylab-400 shrink-0" />
                <span className="text-[11px] text-skylab-300">Kaç yıl deneyiminiz var?</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DemoSettings() {
  const [settings, setSettings] = useState({ anonymous: false, multiple: false, review: true });

  useEffect(() => {
    const t1 = setTimeout(() => setSettings(s => ({ ...s, anonymous: true, multiple: true, review: false })), 1500);
    const t2 = setTimeout(() => setSettings({ anonymous: false, multiple: false, review: true }), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [settings.anonymous]);

  const Toggle = ({ label, value }) => (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-neutral-400">{label}</span>
      <div className={`h-3.5 w-6 rounded-full p-0.5 transition-colors ${value ? "bg-skylab-500" : "bg-neutral-700"}`}>
        <motion.div className="h-2.5 w-2.5 rounded-full bg-white" animate={{ x: value ? 9 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Ayarlar</p>
      <div className="space-y-2.5 rounded-md border border-white/8 bg-white/3 px-3 py-2.5">
        <Toggle label="Anonim Yanıt" value={settings.anonymous} />
        <Toggle label="Çoklu Yanıt" value={settings.multiple} />
        <Toggle label="Manuel İnceleme" value={settings.review} />
      </div>
    </div>
  );
}

export function DemoFormLink() {
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLinked(true), 1200);
    const t2 = setTimeout(() => setLinked(false), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [linked]);

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Form Bağlama</p>
      <div className="flex items-center justify-center gap-3">
        <div className="rounded-md border border-white/8 bg-white/3 px-3 py-2 text-[10px] text-neutral-300">
          Kayıt Formu
        </div>
        <div className="relative flex items-center">
          <motion.div
            className="h-px w-8"
            animate={{
              backgroundColor: linked ? "rgb(224,200,229)" : "rgb(64,64,64)",
              scaleX: linked ? 1 : 0.3,
            }}
            transition={{ duration: 0.4 }}
          />
          <motion.div
            animate={{ opacity: linked ? 1 : 0, scale: linked ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowRightLeft size={10} className="text-skylab-400" />
          </motion.div>
          <motion.div
            className="h-px w-8"
            animate={{
              backgroundColor: linked ? "rgb(224,200,229)" : "rgb(64,64,64)",
              scaleX: linked ? 1 : 0.3,
            }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <motion.div
          className="rounded-md border px-3 py-2 text-[10px] transition-colors"
          animate={{
            borderColor: linked ? "rgba(174,126,182,0.3)" : "rgba(255,255,255,0.08)",
            color: linked ? "rgb(243,232,245)" : "rgb(163,163,163)",
          }}
          transition={{ duration: 0.3 }}
        >
          Anket Formu
        </motion.div>
      </div>
    </div>
  );
}

export function DemoCollaboration() {
  const [showThird, setShowThird] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setShowThird(v => !v), 2000);
    return () => clearInterval(interval);
  }, []);

  const users = [
    { initials: "AY", role: "Sahip", color: "bg-skylab-600" },
    { initials: "MK", role: "Editör", color: "bg-indigo-600" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Ekip</p>
      <div className="space-y-1.5">
        {users.map((u) => (
          <div key={u.initials} className="flex items-center gap-2 rounded-md border border-white/8 bg-white/3 px-2.5 py-1.5">
            <div className={`h-5 w-5 rounded-full ${u.color} grid place-items-center text-[8px] font-bold text-white`}>{u.initials}</div>
            <span className="text-[11px] text-neutral-300 flex-1">{u.initials}</span>
            <span className="text-[9px] text-neutral-500">{u.role}</span>
          </div>
        ))}
        <AnimatePresence>
          {showThird && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-md border border-skylab-400/20 bg-skylab-500/5 px-2.5 py-1.5">
                <div className="h-5 w-5 rounded-full bg-emerald-600 grid place-items-center text-[8px] font-bold text-white">EK</div>
                <span className="text-[11px] text-skylab-300 flex-1">EK</span>
                <span className="text-[9px] text-skylab-400">Görüntüleyici</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function DemoResponses() {
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSelected(s => (s + 1) % 3), 1800);
    return () => clearInterval(interval);
  }, []);

  const responses = [
    { name: "Ayşe Y.", time: "2dk 34sn", status: "emerald" },
    { name: "Mehmet K.", time: "1dk 12sn", status: "amber" },
    { name: "Elif S.", time: "3dk 05sn", status: "emerald" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Yanıtlar</p>
      <div className="space-y-1">
        {responses.map((r, i) => (
          <motion.div
            key={r.name}
            className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px] transition-colors cursor-pointer ${
              selected === i ? "bg-white/6 border border-white/10" : "border border-transparent"
            }`}
            animate={{ scale: selected === i ? 1.02 : 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`h-1.5 w-1.5 rounded-full ${r.status === "emerald" ? "bg-emerald-400" : "bg-amber-400"}`} />
            <span className="text-neutral-300 flex-1">{r.name}</span>
            <span className="text-neutral-600 text-[9px]">{r.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function DemoApproval() {
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    const t1 = setTimeout(() => setStatus("approved"), 1500);
    const t2 = setTimeout(() => setStatus("pending"), 3200);
    const t3 = setTimeout(() => setStatus("rejected"), 4700);
    const t4 = setTimeout(() => setStatus("pending"), 6400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [status === "pending" && Date.now()]);

  const config = {
    pending: { color: "border-amber-500/20 bg-amber-500/5", text: "text-amber-300", label: "Bekliyor", icon: CircleDot },
    approved: { color: "border-emerald-500/20 bg-emerald-500/5", text: "text-emerald-300", label: "Onaylandı", icon: CheckCircle },
    rejected: { color: "border-red-500/20 bg-red-500/5", text: "text-red-300", label: "Reddedildi", icon: XCircle },
  };

  const c = config[status];

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Onay Durumu</p>
      <motion.div
        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-3 ${c.color}`}
        layout
      >
        <motion.div key={status} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
          <c.icon size={16} className={c.text} />
        </motion.div>
        <motion.span key={c.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`text-xs font-medium ${c.text}`}>
          {c.label}
        </motion.span>
      </motion.div>
      <div className="flex gap-1.5">
        <button onClick={() => setStatus("approved")} className="flex-1 flex items-center justify-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/5 py-1.5 text-[10px] text-emerald-400 hover:bg-emerald-500/10 transition-colors">
          <Check size={10} /> Onayla
        </button>
        <button onClick={() => setStatus("rejected")} className="flex-1 flex items-center justify-center gap-1 rounded-md border border-red-500/20 bg-red-500/5 py-1.5 text-[10px] text-red-400 hover:bg-red-500/10 transition-colors">
          <X size={10} /> Reddet
        </button>
      </div>
    </div>
  );
}

export function DemoArchive() {
  const [archived, setArchived] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setArchived(true), 1500);
    const t2 = setTimeout(() => setArchived(false), 3500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [archived]);

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Arşivleme</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 rounded-md border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] text-neutral-300">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="flex-1">Ayşe Y.</span>
        </div>
        <AnimatePresence>
          {!archived && (
            <motion.div
              initial={{ opacity: 1, x: 0, height: "auto" }}
              exit={{ opacity: 0, x: 40, height: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 rounded-md border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] text-neutral-300">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="flex-1">Mehmet K.</span>
                <Archive size={10} className="text-neutral-600" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2 rounded-md border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] text-neutral-300">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="flex-1">Elif S.</span>
        </div>
      </div>
      {archived && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-neutral-600 text-center">
          1 yanıt arşivlendi
        </motion.p>
      )}
    </div>
  );
}

export function DemoFilter() {
  const [active, setActive] = useState(null);

  useEffect(() => {
    const filters = ["status", "role", null, "search"];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % filters.length;
      setActive(filters[i]);
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  const Chip = ({ label, isActive }) => (
    <motion.div
      className={`rounded-md border px-2 py-1 text-[10px] transition-colors ${
        isActive ? "border-skylab-400/30 bg-skylab-500/10 text-skylab-300" : "border-white/8 bg-white/3 text-neutral-500"
      }`}
      animate={{ scale: isActive ? 1.05 : 1 }}
      transition={{ duration: 0.2 }}
    >
      {label}
    </motion.div>
  );

  return (
    <div className="space-y-3">
      <p className="text-[9px] uppercase tracking-wider text-neutral-600">Filtreler</p>
      <div className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/3 px-2.5 py-1.5">
        <Search size={10} className="text-neutral-600" />
        <motion.span
          className="text-[11px]"
          animate={{ color: active === "search" ? "rgb(243,232,245)" : "rgb(82,82,82)" }}
        >
          {active === "search" ? "Kayıt..." : "Ara..."}
        </motion.span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip label="Durum" isActive={active === "status"} />
        <Chip label="Rol" isActive={active === "role"} />
        <Chip label="Anonim" isActive={false} />
        <Chip label="Çoklu" isActive={false} />
      </div>
    </div>
  );
}