"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, CircleGauge, CopyPlus, User2 } from "lucide-react";

import { REGISTRY } from "@/app/components/form-registry";
import { useCloneGroupMutation } from "@/lib/hooks/useGroupShare";
import Popover from "@/app/components/utils/Popover";

const formatName = (raw) => {
    if (!raw) return "";
    return raw.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ");
};

const getInitials = (label) => {
    if (!label) return "?";
    const cleaned = String(label).trim();
    if (!cleaned) return "?";
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatExpiresAt = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
};

const getRemainingLabel = (expiresAt) => {
    if (!expiresAt) return null;
    const target = new Date(expiresAt).getTime();
    if (Number.isNaN(target)) return null;
    const diffMs = target - Date.now();
    if (diffMs <= 0) return "Süresi doldu";
    const hours = Math.floor(diffMs / 3_600_000);
    const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
    if (hours <= 0) return `${minutes} dk kaldı`;
    if (hours >= 24) {
        const days = Math.floor(hours / 24);
        const remHours = hours % 24;
        return remHours === 0 ? `${days} gün kaldı` : `${days}g ${remHours}s kaldı`;
    }
    return `${hours}s ${minutes}dk kaldı`;
};

function SharedByPanel({ group, token, expiresAt }) {
    const router = useRouter();
    const { mutate: cloneGroup, isPending, isError, error, isSuccess, reset } = useCloneGroupMutation();

    const sharedBy = group?.sharedBy ?? null;
    const fullName = formatName(sharedBy?.fullName) || "Bilinmiyor";
    const email = sharedBy?.email || "";
    const initials = getInitials(fullName);
    const expiresLabel = formatExpiresAt(expiresAt);
    const [remaining, setRemaining] = useState(() => getRemainingLabel(expiresAt));

    useEffect(() => {
        if (!expiresAt) {
            setRemaining(null);
            return;
        }
        setRemaining(getRemainingLabel(expiresAt));
        const interval = setInterval(() => setRemaining(getRemainingLabel(expiresAt)), 60_000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    useEffect(() => {
        if (!isError) return;
        const timer = setTimeout(() => reset(), 3000);
        return () => clearTimeout(timer);
    }, [isError, reset]);

    const handleClone = () => {
        if (!group?.id || isPending) return;
        cloneGroup(
            { groupId: group.id, token },
            {
                onSuccess: (data) => {
                    const newGroup = data?.data ?? data;
                    const nextId = newGroup?.id;
                    if (nextId) router.push(`/admin/component-groups/${nextId}`);
                },
            }
        );
    };

    return (
        <motion.div className="relative flex min-w-0 rounded-xl p-2 overflow-hidden max-w-xl col-span-4 h-[93vh]"
            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <div className="flex h-full min-w-0 flex-1 flex-col rounded-xl">
                <div className="h-10 flex items-center justify-start px-4 text-sm tracking-wide border-b border-neutral-800">
                    <span className="font-semibold text-neutral-200">Paylaşılan Grup</span>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar">
                    <div className="px-4 py-4 border-b border-white/5">
                        <p className="text-3xs uppercase tracking-[0.18em] text-neutral-500 mb-2">Paylaşan</p>
                        <div className="flex items-center gap-3">
                            <div className="h-11 w-11 rounded-xl border border-white/10 bg-neutral-900/70 text-neutral-200 grid place-items-center font-semibold text-sm overflow-hidden shrink-0">
                                {sharedBy?.profilePictureUrl ? (
                                    <img src={sharedBy.profilePictureUrl} alt={fullName} className="h-full w-full object-cover" />
                                ) : sharedBy?.fullName ? (
                                    <span>{initials}</span>
                                ) : (
                                    <User2 size={20} className="text-neutral-400" />
                                )}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                                <p className="text-sm font-semibold text-neutral-100 truncate leading-tight">{fullName}</p>
                                {email && <p className="text-3xs text-neutral-500 truncate">{email}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="px-4 py-4 border-b border-white/5 space-y-2">
                        <p className="text-3xs uppercase tracking-[0.18em] text-neutral-500">Bağlantı</p>
                        <p className="text-2xs leading-relaxed text-neutral-400">
                            Bu grubu sadece görüntüleyebilirsiniz. Düzenlemek için önce kendi gruplarınıza ekleyin.
                        </p>
                        <div className="flex items-center justify-between gap-2 text-2xs text-neutral-500 pt-1">
                            <span>{remaining ?? "48 saat geçerli"}</span>
                            {expiresLabel && <span className="truncate text-neutral-600">{expiresLabel}</span>}
                        </div>
                    </div>

                    <div className="px-4 py-4">
                        <Popover open={isError} error={error} variant="error" align="bottom-right">
                            <button type="button" onClick={handleClone} disabled={isPending || isSuccess}
                                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                                    isError ? "border-red-500/30 bg-red-500/10 text-red-200"
                                    : isSuccess ? "border-skylab-400/30 bg-skylab-400/10 text-skylab-300"
                                    : "border-skylab-400/30 bg-skylab-400/10 text-skylab-300 hover:bg-skylab-400/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                }`}
                            >
                                {isPending ? <CircleGauge size={16} className="animate-spin" /> : isError ? <CircleAlert size={16} /> : <CopyPlus size={16} />}
                                <span>{isPending ? "Ekleniyor..." : isError ? "Hata Oluştu" : isSuccess ? "Eklendi" : "Kendime Ekle"}</span>
                            </button>
                        </Popover>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function PreviewCanvas({ schema, title }) {
    return (
        <motion.div className="col-span-8 min-h-[80vh] max-h-[88vh] p-2"
            initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
        >
            <div className="max-w-3xl mx-auto px-4 h-10 flex items-center gap-2 border-b border-neutral-800">
                <span className="w-full pr-5 bg-transparent text-sm font-semibold text-neutral-200 tracking-wide leading-none truncate">
                    {title || "İsimsiz Grup"}
                </span>
            </div>
            <div className="overflow-y-auto rounded-xl scrollbar-hidden h-full">
                <ul className="flex flex-col gap-2 max-w-2xl mx-auto mb-4 pointer-events-none select-none">
                    {schema.map((field, index) => {
                        const entry = REGISTRY[field.type];
                        const FormComponent = entry?.Create;
                        if (!FormComponent) return null;
                        const isSeparator = field.type === "separator";
                        const questionNumber = isSeparator ? "—" : schema.slice(0, index).filter(f => f.type !== "separator").length + 1;
                        return (
                            <li key={field.id ?? index} className="flex flex-col">
                                <FormComponent questionNumber={questionNumber} props={field.props} readOnly={true} condition={field.condition} availableFields={[]} />
                            </li>
                        );
                    })}
                </ul>
            </div>
        </motion.div>
    );
}

export default function SharedGroupPreview({ group, token }) {
    const schema = Array.isArray(group?.schema) ? group.schema : [];
    const expiresAt = group?.shareExpiresAt ?? null;

    return (
        <div className="flex-1 h-full w-full p-4">
            <div className="grid grid-cols-12 gap-4">
                <PreviewCanvas schema={schema} title={group?.title} />
                <SharedByPanel group={group} token={token} expiresAt={expiresAt} />
            </div>
        </div>
    );
}
