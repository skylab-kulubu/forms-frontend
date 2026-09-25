import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UserMinus, Users } from "lucide-react";
import SearchPicker from "../../../../components/utils/SearchPicker";
import Avatar from "@/app/components/utils/Avatar";
import { fetchUserByMail, useUserByMailQuery } from "@/lib/hooks/useUser";
import { useFormEditor } from "../FormEditorContext";
import { MenuPill, PANEL_SECTION, PanelButton, PanelInput, PillBadge, ROW, SectionHeader } from "@/app/admin/components/utils/SidePanel";

const ROLE_OPTIONS = [
    { value: 2, label: "Editör", hint: "düzenleyebilir" },
    { value: 1, label: "Okuyucu", hint: "yalnız görür" },
];

const READER_OPTIONS = [{ value: 1, label: "Okuyucu" }];

function normalizeUserName(username) {
    return username?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ");
}

function formatFullName(firstName, lastName) {
    const fullName = [firstName, lastName].filter(Boolean).join(" ").toLocaleLowerCase("tr-TR");
    if (!fullName) return "--";
    return fullName.replace(/(^|\s)(\S)/g, (_, space, char) => space + char.toLocaleUpperCase("tr-TR"));
};

function collaboratorUser(selectedUser) {
    const fullName = formatFullName(selectedUser.firstName, selectedUser.lastName);
    return {
        id: selectedUser.id,
        fullName: fullName === "--" ? (selectedUser.firstName || selectedUser.email || "--") : fullName,
        email: selectedUser.email,
        profilePictureUrl: selectedUser.profilePictureUrl || null,
    };
}

export function LibrarySettingsEditors() {
    const { state, dispatch } = useFormEditor();
    const { editors, userRole } = state;

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
    const editorsList = useMemo(() => (Array.isArray(editors) ? editors : []), [editors]);

    useEffect(() => {
        const timer = setTimeout(() => { setDebouncedSearch(userSearch); }, 300);
        return () => clearTimeout(timer);
    }, [userSearch]);

    const { data: usersData, isLoading: isUsersLoading } = useUserByMailQuery({ email: debouncedSearch, enabled: (debouncedSearch.length > 1) });
    const foundUsers = Array.isArray(usersData) ? usersData : (usersData?.data || []);

    useEffect(() => {
        const handleClick = (event) => { if (userPickerRef.current && !userPickerRef.current.contains(event.target)) setShowUserPicker(false); };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleAddEditor = (selectedUser) => {
        if (editorsList.find((e) => e.user.id === selectedUser.id)) return;

        const newCollaborator = {
            user: collaboratorUser(selectedUser),
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
                    user: collaboratorUser(u),
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

    const renderRole = (editor, roleValue) => {
        if (roleValue === 3) return <PillBadge>Sahip</PillBadge>;
        if (canManageRoles) {
            return (
                <MenuPill value={roleValue} options={ROLE_OPTIONS} onSelect={(value) => handleChangeEditorRole(editor.user.id, value)}
                    onDelete={() => handleRemoveEditor(editor)} deleteLabel="İzni kaldır"
                />
            );
        }
        if (canRemoveReadersOnly && roleValue === 1) {
            return <MenuPill value={1} options={READER_OPTIONS} onSelect={() => {}} onDelete={() => handleRemoveEditor(editor)} deleteLabel="İzni kaldır" />;
        }
        return <PillBadge>{roleValue === 2 ? "Editör" : "Okuyucu"}</PillBadge>;
    };

    const isRemoveMode = boardMemberIds.length > 0;

    return (
        <section className={PANEL_SECTION}>
            <SectionHeader title="Düzenleme ekibi" description="Formu düzenleyebilecek kişileri buradan ekleyin ya da kaldırın."
                expanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)}
            />

            <AnimatePresence initial={false}>
            {isExpanded && (
            <motion.div key="editors-body" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onAnimationStart={() => setIsAnimating(true)} onAnimationComplete={() => setIsAnimating(false)} className={isAnimating ? "overflow-hidden" : ""}>
            <div className="space-y-4">
            <div className="space-y-3">
                {sortedEditors.map((editor, index) => {
                    const roleValue = Number(editor.role);
                    return (
                        <div key={editor.user.id || index} className={`${ROW} flex items-center justify-between gap-3 border-white/10 px-3 py-2.5`}>
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Avatar name={editor.user?.fullName} email={editor.user?.email} photoUrl={editor.user?.profilePictureUrl} size="md" />
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-100 truncate">{normalizeUserName(editor.user.fullName) || "--"}</p>
                                    <p className="text-2xs text-neutral-500 truncate">{editor.user.email}</p>
                                </div>
                            </div>
                            {renderRole(editor, roleValue)}
                        </div>
                    );
                })}
            </div>

            {canManageRoles && (
                <PanelButton icon={isBulkAdding ? Loader2 : isRemoveMode ? UserMinus : Users} iconClassName={isBulkAdding ? "animate-spin" : ""}
                    danger={isRemoveMode} disabled={isBulkAdding} className="w-full"
                    onClick={isRemoveMode ? handleBulkRemoveBoardMembers : handleBulkAddBoardMembers}
                >
                    {isBulkAdding ? "Ekleniyor..." : isRemoveMode ? "Yönetim Kurulunu kaldır" : "Yönetim Kurulunu ekle"}
                </PanelButton>
            )}

            <div className="relative" ref={userPickerRef}>
                <PanelInput value={userSearch} onChange={(event) => { setUserSearch(event.target.value); if (!showUserPicker) setShowUserPicker(true); }} onFocus={() => setShowUserPicker(true)}
                    placeholder="E-posta ile kullanıcı ara..." aria-label="E-posta ile kullanıcı ara"
                />
                <AnimatePresence>
                    {showUserPicker && userSearch.length >= 2 && (
                        <SearchPicker searchValue={userSearch} onSearchChange={setUserSearch} items={foundUsers} itemsPerPage={4} activeItemId={null} getItemId={(u) => u.id} onSelect={handleAddEditor} searchable={false} loading={isUsersLoading} footerText={isUsersLoading ? "Aranıyor..." : "Listeden kullanıcı seçiniz."} showClear={false} className="absolute top-full left-0 mt-1 w-full"
                            renderItem={(user, { active, onSelect }) => {
                                const isAdded = editorsList.some(e => e.user.id === user.id);
                                return (
                                    <button type="button" onClick={isAdded ? undefined : onSelect} disabled={isAdded} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${active ? "bg-white/10 text-neutral-100" : "text-neutral-200"} ${isAdded ? "opacity-50 cursor-default" : "hover:bg-white/5"}`}>
                                        <Avatar name={user.fullName} email={user.email} photoUrl={user.profilePictureUrl} size="md" />
                                        <div className="flex-1 min-w-0"><p className="font-medium leading-tight truncate">{formatFullName(user.firstName, user.lastName)}</p><p className="text-2xs text-neutral-500 truncate">{user.email}</p></div>
                                        {isAdded && <span className="text-3xs text-skylab-300">Ekli</span>}
                                    </button>
                                );
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>
            </div>
            </motion.div>
            )}
            </AnimatePresence>
        </section>
    );
}
