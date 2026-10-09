"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowRightLeft, X } from "lucide-react";
import SearchPicker from "@/app/components/utils/SearchPicker";
import Avatar from "@/app/components/utils/Avatar";
import ApprovalOverlay from "./ApprovalOverlay";
import { useUserByMailQuery } from "@/lib/hooks/useUser";
import { useTransferOwnershipMutation } from "@/lib/hooks/useOwnership";
import { DELETED_USER_ID } from "@/lib/deleted-user";
import { FOCUS_RING, PANEL_SECTION, PILL_TONE, PanelInput, PanelNotice, ROW, SectionHeader } from "./utils/SidePanel";

const DANGER_ACTION = `group flex h-7 w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-2xs font-medium text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 ${FOCUS_RING} disabled:pointer-events-none disabled:opacity-40`;

function personName(user) {
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.fullName;
    if (!name) return user?.email || "--";
    return name.toLocaleLowerCase("tr-TR").replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toLocaleUpperCase("tr-TR"));
}

function OwnerPicker({ excludeIds, onSelect }) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const handleClick = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const { data, isLoading } = useUserByMailQuery({ email: debouncedSearch, enabled: debouncedSearch.length > 1 });
    const users = (Array.isArray(data) ? data : data?.data || []).filter((user) => user?.id && !excludeIds.includes(user.id));

    const handleSelect = (user) => {
        onSelect(user);
        setOpen(false);
        setSearch("");
    };

    return (
        <div ref={rootRef} className="relative">
            <PanelInput value={search} onChange={(event) => { setSearch(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
                placeholder="Yeni sahibi e-posta ile ara..." aria-label="Yeni sahibi e-posta ile ara"
            />
            <AnimatePresence>
                {open && search.length >= 2 && (
                    <SearchPicker searchValue={search} onSearchChange={setSearch} items={users} itemsPerPage={4} activeItemId={null} getItemId={(user) => user.id} onSelect={handleSelect} searchable={false} loading={isLoading} footerText={isLoading ? "Aranıyor..." : "Listeden yeni sahibi seçiniz."} showClear={false} className="absolute top-full left-0 mt-1 w-full"
                        renderItem={(user, { active, onSelect: select }) => (
                            <button type="button" onClick={select} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-white/5 ${active ? "bg-white/10 text-neutral-100" : "text-neutral-200"}`}>
                                <Avatar name={personName(user)} email={user.email} photoUrl={user.profilePictureUrl} size="md" />
                                <div className="flex-1 min-w-0"><p className="font-medium leading-tight truncate">{personName(user)}</p><p className="text-2xs text-neutral-500 truncate">{user.email}</p></div>
                            </button>
                        )}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/** Yeni sahibi seçtirip onaylatır ve devreder; `kind` form, group ya da workflow'dur. */
export function OwnershipTransferControls({ kind, itemId, excludeIds = [], preset, context = {}, onTransferred }) {
    const [target, setTarget] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const transferMutation = useTransferOwnershipMutation(kind);

    const handleApprove = () => {
        transferMutation.mutate({ id: itemId, userId: target.id }, {
            onSuccess: () => {
                setConfirmOpen(false);
                setTarget(null);
                onTransferred?.();
            },
            onError: () => setConfirmOpen(false),
        });
    };

    return (
        <div className="space-y-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            {target ? (
                <div className={`${ROW} flex items-center gap-3 border-white/10 px-3 py-2.5`}>
                    <Avatar name={personName(target)} email={target.email} photoUrl={target.profilePictureUrl} size="md" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-neutral-100">{personName(target)}</p>
                        <p className="truncate text-2xs text-neutral-500">{target.email}</p>
                    </div>
                    <button type="button" onClick={() => setTarget(null)} aria-label="Seçimi kaldır"
                        className={`rounded-md p-1 text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200 ${FOCUS_RING}`}
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <OwnerPicker excludeIds={[DELETED_USER_ID, ...excludeIds]} onSelect={(user) => { setTarget(user); transferMutation.reset(); }} />
            )}

            <button type="button" disabled={!target || transferMutation.isPending} onClick={() => setConfirmOpen(true)} className={DANGER_ACTION}>
                <ArrowRightLeft size={13} className="shrink-0" />
                Sahipliği devret
            </button>

            {transferMutation.isError ? (
                <PanelNotice tone="red">{transferMutation.error?.message || "Sahiplik devredilemedi."}</PanelNotice>
            ) : null}

            <ApprovalOverlay open={confirmOpen} preset={preset}
                context={{ ...context, targetName: target ? personName(target) : "", isPending: transferMutation.isPending }}
                onApprove={handleApprove} onReject={() => setConfirmOpen(false)}
            />
        </div>
    );
}

/** Ayar panellerinin en altındaki kırmızı devir bölümü; engel varsa yalnız nedenini gösterir. */
export function OwnershipTransferSection({ description, blockedReason, ...controls }) {
    return (
        <section className={PANEL_SECTION}>
            <SectionHeader title="Sahipliği devret" dot={PILL_TONE.red} description={description} />
            {blockedReason ? <PanelNotice tone="red">{blockedReason}</PanelNotice> : <OwnershipTransferControls {...controls} />}
        </section>
    );
}
