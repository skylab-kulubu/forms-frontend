"use client";

import { useEffect, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button, Combobox } from "@skylab-kulubu/skylcn-ui";
import Avatar from "@/app/components/utils/Avatar";
import ApprovalOverlay from "./ApprovalOverlay";
import { useUserByMailQuery } from "@/lib/hooks/useUser";
import { useTransferOwnershipMutation } from "@/lib/hooks/useOwnership";
import { DELETED_USER_ID } from "@/lib/deleted-user";
import { PANEL_SECTION, PanelButton, PanelNotice, PillBadge, ROW, SectionHeader } from "./utils/SidePanel";

function personName(user) {
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.fullName;
    if (!name) return user?.email || "--";
    return name.toLocaleLowerCase("tr-TR").replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toLocaleUpperCase("tr-TR"));
}

function OwnerPicker({ excludeIds, onSelect }) {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading } = useUserByMailQuery({ email: debouncedSearch, enabled: debouncedSearch.length > 1 });
    const users = (Array.isArray(data) ? data : data?.data || []).filter((user) => user?.id && !excludeIds.includes(user.id));
    // The server is asked from two letters on, so shorter input lists nothing rather than stale results
    const searching = search.length >= 2;
    const items = searching ? users.map((user) => ({ value: user.id, label: personName(user), hint: user.email })) : [];

    return (
        <Combobox items={items} value={null} size="sm" onSearch={setSearch}
            loading={searching && (isLoading || search !== debouncedSearch)}
            onValueChange={(id) => {
                const user = users.find((item) => item.id === id);
                if (user) onSelect(user);
            }}
            placeholder="Yeni sahibi e-posta ile ara..." aria-label="Yeni sahibi e-posta ile ara"
        />
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
        <div className="space-y-3">
            {target ? (
                <>
                    <div className={`${ROW} flex items-center justify-between gap-3 border-border px-3 py-2.5`}>
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar name={personName(target)} email={target.email} photoUrl={target.profilePictureUrl} size="md" />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-foreground">{personName(target)}</p>
                                <p className="truncate text-2xs text-subtle-foreground">{target.email}</p>
                            </div>
                        </div>
                        <PillBadge>Yeni sahip</PillBadge>
                    </div>
                    <div className="flex gap-2">
                        <PanelButton onClick={() => setTarget(null)} disabled={transferMutation.isPending} className="flex-1">Vazgeç</PanelButton>
                        <Button type="button" variant="destructive" size="sm" disabled={transferMutation.isPending} onClick={() => setConfirmOpen(true)} className="flex-1">
                            <ArrowRightLeft className="size-3.5" />
                            Devret
                        </Button>
                    </div>
                </>
            ) : (
                <OwnerPicker excludeIds={[DELETED_USER_ID, ...excludeIds]} onSelect={(user) => { setTarget(user); transferMutation.reset(); }} />
            )}

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
export function OwnershipTransferSection({ description, blockedReason, blockedContent, ...controls }) {
    return (
        <section className={PANEL_SECTION}>
            <SectionHeader title="Sahipliği devret" description={description} />
            {blockedContent ?? (blockedReason ? <PanelNotice tone="neutral">{blockedReason}</PanelNotice> : <OwnershipTransferControls {...controls} />)}
        </section>
    );
}
