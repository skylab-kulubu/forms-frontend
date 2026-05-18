import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, Check, ChevronDown, Eye, Loader2, PencilLine, Plus, User2, UserMinus, Users } from "lucide-react";
import SearchPicker from "../../../../components/utils/SearchPicker";
import { fetchUserByMail, useUserByMailQuery } from "@/lib/hooks/useUser";
import { useFormEditor } from "../FormEditorContext";

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

export function LibrarySettingsEditors() {
    const { state, dispatch } = useFormEditor();
    const { editors, userRole } = state;

    const [openMenuId, setOpenMenuId] = useState(null);
    const [showUserPicker, setShowUserPicker] = useState(false);
    const [userSearch, setUserSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [isBulkAdding, setIsBulkAdding] = useState(false);
    const [boardMemberIds, setBoardMemberIds] = useState([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isAnimating, setIsAnimating] = useState(false);
    const userPickerRef = useRef(null);

    const currentUserRole = Number(userRole || 3);
    const canManageRoles = currentUserRole === 3;
    const canRemoveReadersOnly = currentUserRole === 2;
    const editorsList = Array.isArray(editors) ? editors : [];

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(userSearch); }, 300);
        return () => clearTimeout(timer);
    }, [userSearch]);

    const { data: usersData, isLoading: isUsersLoading } = useUserByMailQuery({ email: debouncedSearch, roles: ["skyforms:form:manage"], enabled: (debouncedSearch.length > 1) });
    const foundUsers = Array.isArray(usersData) ? usersData : (usersData?.data || []);

    useEffect(() => {
        const handleClick = (event) => { if (userPickerRef.current && !userPickerRef.current.contains(event.target)) setShowUserPicker(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleAddEditor = (selectedUser) => {
        if (editorsList.find((e) => e.user.id === selectedUser.id)) return;

        const newCollaborator = {
            user: {
                id: selectedUser.id,
                fullName: selectedUser.firstName,
                email: selectedUser.email,
                profilePictureUrl: selectedUser.profilePictureUrl || null,
            },
            role: 1
        };

        dispatch({ type: "SET_EDITORS", payload: [...editorsList, newCollaborator] });
        setShowUserPicker(false);
        setUserSearch("");
    };

    const handleBulkAddBoardMembers = async () => {
        if (isBulkAdding) return;
        setIsBulkAdding(true);
        try {
            const response = await fetchUserByMail({ roles: ["YK", "DK"] });
            const list = Array.isArray(response) ? response : (response?.data || []);
            const fetchedIds = list.map((u) => u?.id).filter(Boolean);
            const existingIds = new Set(editorsList.map((e) => e.user?.id));
            const newCollaborators = list
                .filter((u) => u?.id && !existingIds.has(u.id))
                .map((u) => ({
                    user: {
                        id: u.id,
                        fullName: u.firstName,
                        email: u.email,
                        profilePictureUrl: u.profilePictureUrl || null,
                    },
                    role: 1,
                }));
            if (newCollaborators.length > 0) {
                dispatch({ type: "SET_EDITORS", payload: [...editorsList, ...newCollaborators] });
            }
            setBoardMemberIds(fetchedIds);
        } finally {
            setIsBulkAdding(false);
        }
    };

    const handleBulkRemoveBoardMembers = () => {
        if (boardMemberIds.length === 0) return;
        const removeSet = new Set(boardMemberIds);
        const nextEditors = editorsList.filter((item) => !removeSet.has(item.user?.id) || Number(item.role) === 3);
        dispatch({ type: "SET_EDITORS", payload: nextEditors });
        setBoardMemberIds([]);
    };

    const handleRemoveEditor = (editor) => {
        const nextEditors = editorsList.filter((item) => item.user?.id !== editor.user?.id);
        dispatch({ type: "SET_EDITORS", payload: nextEditors });
    };

    const handleChangeEditorRole = (editorId, nextRole) => {
        const nextEditors = editorsList.map((item) => item.user?.id === editorId ? { ...item, role: nextRole } : item);
        dispatch({ type: "SET_EDITORS", payload: nextEditors });
    };

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
            <button type="button" onClick={() => setIsExpanded((v) => !v)} className="group flex w-full items-start justify-between gap-4 text-left">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-neutral-100">Düzenleme ekibi</p>
                        <ChevronDown size={14} className={`text-neutral-500 transition-transform duration-200 group-hover:text-neutral-300 ${isExpanded ? "" : "-rotate-90"}`} />
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">Formu düzenleyebilecek kişileri buradan ekleyin ya da kaldırın.</p>
                </div>
                <span className="rounded-full border border-indigo-400/30 px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300/80">Aktif</span>
            </button>

            <AnimatePresence initial={false}>
            {isExpanded && (
            <motion.div key="editors-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeInOut" }} onAnimationStart={() => setIsAnimating(true)} onAnimationComplete={() => setIsAnimating(false)} className={isAnimating ? "overflow-hidden" : ""}>
            <div className="space-y-4 pt-1">
            <div className="space-y-3">
                {sortedEditors.map((editor, index) => {
                    const roleValue = Number(editor.role);
                    return (
                        <div key={editor.user.id || index} className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900/40 px-3 py-2.5 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="grid shrink-0 h-9 w-9 place-items-center rounded-lg bg-neutral-950/20 border border-neutral-950/60 text-xs font-semibold uppercase tracking-wide text-indigo-100/70">
                                    {editor.user?.profilePictureUrl ? (<img src={editor.user?.profilePictureUrl} alt={editor.user.fullName} className="h-full w-full object-cover" />) : (editor.user?.fullName ? (<span>{getInitials(editor.user.fullName)}</span>) : (<User2 size={20} />))}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-50 truncate">{normalizeUserName(editor.user.fullName) || "--"}</p>
                                    <p className="text-[9px] text-neutral-500 truncate">{editor.user.email}</p>
                                </div>
                            </div>

                            <div className="relative flex items-center">
                                {roleValue === 3 ? (
                                    <span className="rounded-lg w-22 mx-auto text-center border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-neutral-300">Sahip</span>
                                ) : canManageRoles ? (
                                    <div className="relative w-22" style={{ zIndex: openMenuId === editor.user.id ? 50 : 10 }}>
                                        <button type="button" onClick={() => setOpenMenuId(openMenuId === editor.user.id ? null : editor.user.id)}
                                            className={`flex w-full items-center justify-between gap-1 border px-3 py-1 text-[11px] transition-colors focus:outline-none 
                                            ${openMenuId === editor.user.id ? 'rounded-t-lg border-white/20 border-b-transparent bg-[#1e1e1e] text-neutral-50'
                                            : 'rounded-lg border-white/10 bg-white/5 text-neutral-300 hover:border-white/20 hover:text-neutral-50 hover:bg-white/10'}`}
                                        >
                                            <span className="mx-auto">{roleValue === 2 ? "Editör" : "Okuyucu"}</span>
                                            <ChevronDown size={12} className={`opacity-70 transition-transform duration-200 ${openMenuId === editor.user.id ? "rotate-180" : ""}`} />
                                        </button>

                                        <AnimatePresence>
                                            {openMenuId === editor.user.id && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15, ease: "easeInOut" }}
                                                    className="absolute left-0 top-full w-full overflow-hidden rounded-b-lg border border-white/20 border-t-0 bg-[#1e1e1e] shadow-xl backdrop-blur-xl -mt-0.5"
                                                >
                                                    <div className="flex flex-col px-1.5 pb-1.5 -pt-0.5">
                                                        <div className="mb-1 mx-1 h-px bg-white/10" />

                                                        <button type="button" onClick={() => { handleChangeEditorRole(editor.user.id, 2); setOpenMenuId(null); }}
                                                            className={`flex w-full items-center  gap-2 rounded-md px-1 py-2 text-[9px] transition-colors focus-visible:outline-none ${roleValue === 2 ? "bg-indigo-400/10 text-indigo-300" : "text-neutral-300 hover:bg-white/5 hover:text-white"}`}
                                                        >
                                                            <span className="flex-1">Düzenleme</span>
                                                        </button>

                                                        <button type="button" onClick={() => { handleChangeEditorRole(editor.user.id, 1); setOpenMenuId(null); }}
                                                            className={`flex w-full items-center gap-2 rounded-md px-1 py-2 text-[9px] transition-colors focus-visible:outline-none ${roleValue === 1 ? "bg-indigo-400/10 text-indigo-300" : "text-neutral-300 hover:bg-white/5 hover:text-white"}`}
                                                        >
                                                            <span className="flex-1">Görüntüleme</span>
                                                        </button>

                                                        <div className="my-1 mx-1 h-px bg-white/10" />

                                                        <button type="button" onClick={() => { handleRemoveEditor(editor); setOpenMenuId(null); }}
                                                            className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-[9px] text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                                                        >
                                                            <span className="flex-1">İzni kaldır</span>
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
                                    <div className="flex items-center">
                                        {canRemoveReadersOnly && roleValue === 1 ? (
                                            <div className="relative group/role">
                                                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300 transition-opacity duration-150 group-hover/role:opacity-0">Okuyucu</span>
                                                <button type="button" onClick={() => handleRemoveEditor(editor)} className="absolute inset-0 inline-flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-red-200 opacity-0 pointer-events-none transition-opacity duration-150 hover:bg-red-500/20 group-hover/role:pointer-events-auto group-hover/role:opacity-100">Sil</button>
                                            </div>
                                        ) : (<span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300">{roleValue === 2 ? "Editör" : "Okuyucu"}</span>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {canManageRoles && (() => {
                const isRemoveMode = boardMemberIds.length > 0;
                const onClick = isRemoveMode ? handleBulkRemoveBoardMembers : handleBulkAddBoardMembers;
                const label = isBulkAdding ? "Ekleniyor..." : isRemoveMode ? "Yönetim Kurulunu Kaldır" : "Yönetim Kurulunu Ekle";
                const icon = isBulkAdding ? <Loader2 size={14} className="animate-spin" />
                    : isRemoveMode ? <UserMinus size={14} className="text-neutral-400 group-hover:text-red-300" />
                    : <Users size={14} className="text-neutral-400 group-hover:text-indigo-300" />;
                const colorClasses = isRemoveMode
                    ? "hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
                    : "hover:border-indigo-400/30 hover:bg-indigo-400/10 hover:text-indigo-200";
                return (
                    <button type="button" onClick={onClick} disabled={isBulkAdding}
                        className={`group flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-neutral-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${colorClasses}`}
                    >
                        {icon}
                        <span>{label}</span>
                    </button>
                );
            })()}

            <div className="pt-1 flex gap-2" ref={userPickerRef}>
                <div className="relative flex-1">
                    <div className="relative">
                        <input type="text" value={userSearch} onChange={(event) => { setUserSearch(event.target.value); if (!showUserPicker) setShowUserPicker(true); }} onFocus={() => setShowUserPicker(true)} placeholder="E-posta ile kullanıcı ara..." className="w-full rounded-lg border border-white/10 bg-neutral-900/60 pr-11 pl-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/15" />
                        <button type="button" aria-label="Ekle" className="group absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg border border-indigo-900/80 bg-indigo-400/10 text-indigo-200 transition-colors hover:bg-indigo-400/20 hover:text-indigo-100">
                            <Plus size={16} className="transition-opacity duration-150 group-hover:hidden" /> <ArrowUp size={16} className="hidden transition-opacity duration-150 group-hover:block" />
                        </button>
                    </div>
                    <AnimatePresence>
                        {showUserPicker && userSearch.length >= 2 && (
                            <SearchPicker searchValue={userSearch} onSearchChange={setUserSearch} items={foundUsers} itemsPerPage={4} activeItemId={null} getItemId={(u) => u.id} onSelect={handleAddEditor} footerText={isUsersLoading ? "Aranıyor..." : "Listeden kullanıcı seçiniz."} showClear={false} className="absolute top-full left-0 mt-1 w-full [&>div>div:first-child]:hidden"
                                renderItem={(user, { active, onSelect }) => {
                                    const isAdded = editorsList.some(e => e.user.id === user.id);
                                    return (
                                        <button type="button" onClick={isAdded ? undefined : onSelect} disabled={isAdded} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${active ? "bg-white/10 text-neutral-100" : "text-neutral-200"} ${isAdded ? "opacity-50 cursor-default" : "hover:bg-white/5"}`}>
                                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-800 border border-white/10 text-xs font-semibold text-neutral-400 shrink-0">{user.profilePictureUrl ? (<img src={user.profilePictureUrl} alt="" className="h-full w-full rounded-full object-cover" />) : getInitials(user.fullName || user.email)}</div>
                                            <div className="flex-1 min-w-0"><p className="font-medium leading-tight truncate">{formatFullName(user.firstName, user.lastName)}</p><p className="text-[11px] text-neutral-500 truncate">{user.email}</p></div>
                                            {isAdded && <span className="text-[10px] text-indigo-300">Ekli</span>}
                                        </button>
                                    );
                                }}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
            </div>
            </motion.div>
            )}
            </AnimatePresence>
        </section>
    );
}