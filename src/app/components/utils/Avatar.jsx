import { User2 } from "lucide-react";

const SIZES = {
  sm: { box: "h-7 w-7 text-3xs", icon: 12 },
  md: { box: "h-9 w-9 text-xs", icon: 16 },
  lg: { box: "h-11 w-11 text-sm", icon: 20 },
};

function getInitials(name, email) {
  const source = (name || email || "").trim();
  if (!source) return "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toLocaleUpperCase("tr-TR");
  return (parts[0][0] + parts[1][0]).toLocaleUpperCase("tr-TR");
}

/** Tek kullanıcı avatarı: fotoğraf > isim/e-posta baş harfleri > User2 ikonu. */
export default function Avatar({ name, email, photoUrl, size = "md", className = "" }) {
  const s = SIZES[size] ?? SIZES.md;
  const initials = getInitials(name, email);

  return (
    <div className={`${s.box} grid shrink-0 place-items-center overflow-hidden rounded-lg border border-white/10 bg-neutral-900/60 font-semibold text-neutral-300 ${className}`}>
      {photoUrl ? (
        <img src={photoUrl} alt={name || ""} className="h-full w-full object-cover" />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User2 size={s.icon} className="text-neutral-500" />
      )}
    </div>
  );
}
