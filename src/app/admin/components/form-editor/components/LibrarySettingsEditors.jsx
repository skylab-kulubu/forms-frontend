import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUp, Check, ChevronDown, Eye, PencilLine, Plus, User2, UserMinus } from "lucide-react";
import SearchPicker from "../../../../components/utils/SearchPicker";
import { useUserByMailQuery } from "@/lib/hooks/useUser";

function normalizeUserName(username) {
    return username?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ");
}

function formatFullName(firstName, lastName) {
    const fullName = [firstName, lastName].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");

    if (!fullName) return "--";

    return fullName.replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toLocaleUpperCase("tr-TR"));
};

function getInitials(name, email) {
    const source = (name || email || "").trim();
    if (!source) return "?";
    const parts = source.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function LibrarySettingsEditors({ editors, onChangeEditorRole, handleAddEditor, handleRemoveEditor, currentUserRole }) {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const userPickerRef = useRef(null);
    const canManageRoles = currentUserRole === 3;
    const canRemoveReadersOnly = currentUserRole === 2;
    const editorsList = Array.isArray(editors) ? editors : [];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(userSearch);
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearch]);

    const { data: usersData, isLoading: isUsersLoading } = useUserByMailQuery({ email: debouncedSearch, roles: ["ADMIN", "YK", "DK", "EKIP"], enabled: (debouncedSearch.length > 1) });

    const foundUsers = Array.isArray(usersData) ? usersData : (usersData?.data || []);

    useEffect(() => {
        const handleClick = (event) => {
            if (userPickerRef.current && !userPickerRef.current.contains(event.target)) setShowUserPicker(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const onSelectUser = (user) => {
        if (handleAddEditor) handleAddEditor(user);
        setShowUserPicker(false);
        setUserSearch("");
    }

    const sortedEditors = useMemo(() => {
        const byName = (editor) => {
            const name = editor?.user?.fullName || editor?.user?.email || "";
            return name.trim().toLocaleLowerCase("tr-TR");
        };

        return [...editorsList].sort((a, b) => {
            const roleA = Number(a?.role) || 0;
            const roleB = Number(b?.role) || 0;
            if (roleA !== roleB) return roleB - roleA;
            return byName(a).localeCompare(byName(b), "tr-TR");
        });
    }, [editorsList]);

    return (
        <section className="pb-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-neutral-100">Düzenleme ekibi</p>
                    <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                        Formu düzenleyebilecek kişileri buradan ekleyin ya da kaldırın.
                    </p>
                </div>
                <span className="rounded-full border border-emerald-500/30 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
                    Aktif
                </span>
            </div>

            <div className="space-y-3">
                {sortedEditors.map((editor, index) => {
                    const roleValue = Number(editor.role);
                    return (
                        <div key={editor.user.id || index} className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900/40 px-3 py-2.5 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="grid shrink-0 h-9 w-9 place-items-center rounded-lg bg-neutral-950 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                                    {editor.user?.profilePictureUrl ? (
                                        <img src={editor.user?.profilePictureUrl} alt={editor.user.fullName} className="h-full w-full object-cover" />
                                    ) : (editor.user?.fullName ? (<span>{getInitials(editor.user.fullName)}</span>
                                    ) : (<User2 size={20}/>)
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-50 truncate">{normalizeUserName(editor.user.fullName) || "--"}</p>
                                    <p className="text-[9px] text-neutral-500 truncate">{editor.user.email}</p>
                                </div>
                            </div>

                            <div className="relative flex items-center">
                                {roleValue === 3 ? (
                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                                        {roleValue === 3 ? "Sahip" : "?   "}
                                    </span>
                                ) : canManageRoles ? (
                                    <div className="relative">
                                        <button type="button" onClick={() => setOpenMenuId(openMenuId === editor.user.id ? null : editor.user.id)}
                                            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300 transition-colors hover:border-white/20 hover:text-neutral-50"
                                        >
                                            {roleValue === 2 ? "Editör" : "Okuyucu"}
                                            <ChevronDown size={12} className="opacity-70" />
                                        </button>
                                        {openMenuId === editor.user.id && (
                                            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-neutral-900/80 p-1.5 shadow-xl backdrop-blur supports-backdrop-filter:bg-neutral-900/60">
                                                <button type="button" onClick={() => { onChangeEditorRole && onChangeEditorRole(editor.user.id, 2); setOpenMenuId(null); }}
                                                    className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 ${roleValue === 2 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-transparent text-neutral-200 hover:border-white/10 hover:bg-white/5"}`}
                                                >
                                                    {roleValue === 2 ? <Check size={12} className="text-emerald-300" /> : <PencilLine size={12} className="shrink-0" />}
                                                    <span className="flex-1">Düzenleme</span>
                                                </button>
                                                <button type="button" onClick={() => { onChangeEditorRole && onChangeEditorRole(editor.user.id, 1); setOpenMenuId(null); }}
                                                    className={`mt-1 flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/30 ${roleValue === 1 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-transparent text-neutral-200 hover:border-white/10 hover:bg-white/5"}`}
                                                >
                                                    {roleValue === 1 ? <Check size={12} className="text-emerald-300" /> : <Eye size={12} className="shrink-0" />}
                                                    <span className="flex-1">Görüntüleme</span>
                                                </button>
                                                <div className="my-1 h-px bg-white/10" />
                                                <button type="button" onClick={() => { handleRemoveEditor(editor); setOpenMenuId(null); }}
                                                    className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2.5 py-2 text-[11px] text-red-300/80 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                                                >
                                                    <UserMinus size={12} className="shrink-0" />
                                                    <span className="flex-1">İzinleri kaldır</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        {canRemoveReadersOnly && roleValue === 1 ? (
                                            <div className="relative group/role">
                                                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300 transition-opacity duration-150 group-hover/role:opacity-0 group-hover/role:pointer-events-none">
                                                    Okuyucu
                                                </span>
                                                <button type="button" onClick={() => handleRemoveEditor(editor)} aria-label="Remove reader"
                                                    className="absolute inset-0 inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-red-200 opacity-0 pointer-events-none transition-opacity duration-150 hover:bg-red-500/20 group-hover/role:pointer-events-auto group-hover/role:opacity-100 focus:pointer-events-auto focus:opacity-100"
                                                >
                                                    Sil
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                                                {roleValue === 2 ? "Editör" : "Okuyucu"}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="pt-1 flex gap-2" ref={userPickerRef}>
                <div className="relative flex-1">
                    <div className="relative">
                        <input type="text" value={userSearch}  onChange={(event) => { setUserSearch(event.target.value); if (!showUserPicker) setShowUserPicker(true); }}
                            onFocus={() => setShowUserPicker(true)} placeholder="E-posta ile kullanıcı ara..."
                            className="w-full rounded-lg border border-white/10 bg-neutral-900/60 pr-11 pl-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/15"
                        />
                        <button type="button" aria-label="Ekle"
                            className="group absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg border border-emerald-900/80 bg-emerald-500/10 text-emerald-200 transition-colors hover:bg-emerald-500/20 hover:text-emerald-100"
                        >
                            <Plus size={16} className="transition-opacity duration-150 group-hover:hidden" />
                            <ArrowUp size={16} className="hidden transition-opacity duration-150 group-hover:block" />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showUserPicker && userSearch.length >= 2 && (
                            <SearchPicker searchValue={userSearch} onSearchChange={setUserSearch} items={foundUsers} itemsPerPage={4} 
                                activeItemId={null} getItemId={(u) => u.id} onSelect={onSelectUser} 
                                footerText={isUsersLoading ? "Aranıyor..." : "Listeden kullanıcı seçiniz."}
                                showClear={false} className="absolute top-full left-0 mt-1 w-full [&>div>div:first-child]:hidden" 
                                renderItem={(user, { active, onSelect }) => {
                                    const isAdded = editorsList.some(e => e.user.id === user.id);
                                    return (
                                        <button type="button" onClick={isAdded ? undefined : onSelect} disabled={isAdded}
                                            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${active ? "bg-white/10 text-neutral-100" : "text-neutral-200"} ${isAdded ? "opacity-50 cursor-default" : "hover:bg-white/5"}`}
                                        >
                                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-400 shrink-0">
                                                {user.profilePictureUrl ? (
                                                    <img src={user.profilePictureUrl} alt="" className="h-full w-full rounded-full object-cover" />
                                                ) : getInitials(user.fullName || user.email)}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium leading-tight truncate">{formatFullName(user.firstName, user.lastName)}</p>
                                                <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                                            </div>
                                            
                                            {isAdded && <span className="text-[10px] text-emerald-500">Ekli</span>}
                                        </button>
                                    );
                                }}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}