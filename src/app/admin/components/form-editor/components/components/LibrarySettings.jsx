import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Check, ChevronDown, ChevronsUpDown, Eye, PencilLine, Plus, Search, UserMinus, X } from "lucide-react";

export function LibrarySettings({ editors, onChangeEditorRole, handleAddEditor, handleRemoveEditor, newEditor, setNewEditor,
    setLinkedFormId, linkedFormId, linkedForm, isAcceptingResponses, setIsAcceptingResponses, allowAnonymousResponses,
    setAllowAnonymousResponses, allowMultipleResponses, setAllowMultipleResponses, LINKABLE_FORMS
}) {
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showFormPicker, setShowFormPicker] = useState(false);
    const [formSearch, setFormSearch] = useState("");
    const formPickerRef = useRef(null);

    const selectedForm = linkedForm ?? LINKABLE_FORMS.find((form) => form.id === linkedFormId) ?? null;

    useEffect(() => {
        if (!showFormPicker) return;
        const handleClick = (event) => {
            if (formPickerRef.current && !formPickerRef.current.contains(event.target)) {
                setShowFormPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showFormPicker]);

    const filteredForms = useMemo(() => {
        const q = formSearch.trim().toLowerCase();
        if (!q) return LINKABLE_FORMS;
        return LINKABLE_FORMS.filter((form) => form.label.toLowerCase().includes(q));
    }, [formSearch, LINKABLE_FORMS]);

    const chooseForm = (formId) => {
        setLinkedFormId && setLinkedFormId(formId);
        setShowFormPicker(false);
        setFormSearch("");
    };

    const clearForm = () => {
        setLinkedFormId && setLinkedFormId("");
        setShowFormPicker(false);
        setFormSearch("");
    };

    return (
        <div className="flex flex-col divide-y divide-neutral-800/60 p-4 text-sm text-neutral-200">
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
                    {editors.map((editor) => (
                        <div key={editor.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900/40 px-3 py-2.5 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="grid h-9 w-9 place-items-center rounded-lg bg-neutral-950 text-xs font-semibold uppercase tracking-wide text-emerald-200">
                                    {(editor.name || editor.email).charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-neutral-50">{editor.name}</p>
                                    <p className="text-xs text-neutral-500">{editor.email}</p>
                                </div>
                            </div>

                            <div className="relative flex items-center">
                                {editor.locked ? (
                                    <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                                        {editor.role}
                                    </span>
                                ) : (
                                    <div className="relative">
                                        <button type="button" onClick={() => setOpenMenuId(openMenuId === editor.id ? null : editor.id)}
                                            className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300 transition-colors hover:border-white/20 hover:text-neutral-50"
                                        >
                                            {editor.role}
                                            <ChevronDown size={12} className="opacity-70" />
                                        </button>
                                        {openMenuId === editor.id && (
                                            <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-white/10 bg-neutral-950/95 p-1 shadow-2xl backdrop-blur">
                                                <button type="button" onClick={() => { onChangeEditorRole && onChangeEditorRole(editor.id, "Düzenleme"); setOpenMenuId(null); }}
                                                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] transition-colors ${editor.role === "Düzenleme" ? "bg-emerald-500/10 text-emerald-200" : "text-neutral-200 hover:bg-white/5"}`}
                                                >
                                                    {editor.role === "Düzenleme" ? <Check size={12} className="text-emerald-300" /> : <PencilLine size={12} className="shrink-0" />}
                                                    <span className="flex-1">Düzenleme</span>
                                                </button>
                                                <button type="button" onClick={() => { onChangeEditorRole && onChangeEditorRole(editor.id, "Görüntüleme"); setOpenMenuId(null); }}
                                                    className={`mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] transition-colors ${editor.role === "Görüntüleme" ? "bg-emerald-500/10 text-emerald-200" : "text-neutral-200 hover:bg-white/5"}`}
                                                >
                                                    {editor.role === "Görüntüleme" ? <Check size={12} className="text-emerald-300" /> : <Eye size={12} className="shrink-0" />}
                                                    <span className="flex-1">Görüntüleme</span>
                                                </button>
                                                <div className="my-1 h-px bg-neutral-900" />
                                                <button type="button" onClick={() => { handleRemoveEditor(editor); setOpenMenuId(null); }}
                                                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-red-300/80 transition-colors hover:bg-red-500/10 hover:text-red-200"
                                                >
                                                    <UserMinus size={12} className="shrink-0" />
                                                    <span className="flex-1">İzinleri kaldır</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <form onSubmit={handleAddEditor} className="pt-1 flex gap-2">
                    <div className="relative flex-1">
                        <input type="text" value={newEditor} onChange={(event) => setNewEditor(event.target.value)}
                            placeholder="E-posta veya kullanıcı adı"
                            className="w-full rounded-lg border border-white/10 bg-neutral-900/60 pr-11 pl-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/15"
                        />
                        <button type="submit" aria-label="Ekle"
                            className="group absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-200 transition-colors hover:bg-emerald-500/20 hover:text-emerald-100"
                        >
                            <Plus size={16} className="transition-opacity duration-150 group-hover:hidden" />
                            <ArrowUp size={16} className="hidden transition-opacity duration-150 group-hover:block" />
                        </button>
                    </div>
                </form>
            </section>

            <section className="py-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-semibold text-neutral-100">Başka bir form ile bağla</p>
                        <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                            Bir sonraki formun ne zaman açılacağını kontrol etmek için bağımlılık kurun.
                        </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-0.5 text-[10px] uppercase tracking-[0.2em] text-neutral-400">
                        Opsiyonel
                    </span>
                </div>

                <div className="space-y-3">
                    <label className="px-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Hedef form</label>
                    <div className="relative" ref={formPickerRef}>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                                <ChevronsUpDown size={14} />
                            </span>
                            <button type="button" aria-haspopup="dialog" aria-expanded={showFormPicker} onClick={() => setShowFormPicker((prev) => !prev)}
                                className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-neutral-900/60 pl-9 pr-3 py-2 text-left text-sm text-neutral-100 shadow-sm outline-none transition hover:bg-white/5 focus:border-white/25 focus:ring-2 focus:ring-white/15"
                            >
                                <span className={selectedForm ? "text-neutral-100" : "text-neutral-500"}>
                                    {selectedForm ? selectedForm.label : "Bağlantı seçin"}
                                </span>
                                {selectedForm && (
                                    <span onClick={(event) => { event.stopPropagation(); clearForm(); }} className="ml-2 text-neutral-500 transition-colors hover:text-neutral-200">
                                        <X size={14} />
                                    </span>
                                )}
                            </button>
                        </div>

                        {showFormPicker && (
                            <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-neutral-900/80 p-3 text-neutral-100 shadow-xl backdrop-blur supports-backdrop-filter:bg-neutral-900/60">
                                <div className="relative">
                                    <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500">
                                        <Search size={14} />
                                    </span>
                                    <input autoFocus type="text" value={formSearch} onChange={(event) => setFormSearch(event.target.value)}
                                        placeholder="Ara..."
                                        className="w-full rounded-md border border-white/10 bg-white/5 pl-7 pr-2 py-1.5 text-sm text-neutral-100 outline-none placeholder-neutral-500 focus:border-white/20"
                                    />
                                </div>

                                <div className="mt-2 max-h-56 overflow-auto rounded-lg border border-white/10 bg-white/5">
                                    {filteredForms.length === 0 && (
                                        <div className="px-3 py-2 text-[12px] text-neutral-400">Eşleşme bulunamadı.</div>
                                    )}

                                    {filteredForms.map((form) => {
                                        const active = selectedForm?.id === form.id;
                                        return (
                                            <button key={form.id} type="button" onClick={() => chooseForm(form.id)}
                                                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition hover:bg-white/10 ${active ? "bg-white/15 text-neutral-100 ring-1 ring-white/20" : "text-neutral-200"}`}
                                            >
                                                <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400/70" />
                                                <div className="flex-1">
                                                    <p className="font-medium leading-tight">{form.label}</p>
                                                    <p className="text-[11px] text-neutral-500">Form cevabı onaylanınca görünür.</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-[11px] text-neutral-500">Bu form tamamlandığında seçilen forma geçilir.</span>
                                    {selectedForm && (
                                        <button type="button" onClick={clearForm} className="text-[11px] text-neutral-400 transition-colors hover:text-neutral-200">
                                            Temizle
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {selectedForm && (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                            <span>{selectedForm.label} ile eşleştirildi.</span>
                            <button type="button" className="text-emerald-100/80 transition-colors hover:text-emerald-50" onClick={clearForm}>
                                Kaldır
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <section className="py-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="font-semibold text-neutral-100">Form durumu</p>
                        <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                            Formu yayından kaldırmadan önce geçici olarak duraklatabilir veya yeniden açabilirsiniz.
                        </p>
                    </div>
                    <span className={`rounded-full border px-3 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${isAcceptingResponses ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" : "border-neutral-700 bg-neutral-900/60 text-neutral-400"}`}>
                        {isAcceptingResponses ? "Yayında" : "Duraklatıldı"}
                    </span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-semibold text-neutral-100">Cevap kabulü</p>
                            <p className="text-[10px] text-neutral-500">Kapattığınızda kullanıcılar formu görebilir fakat gönderemez.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setIsAcceptingResponses((prev) => !prev)} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${isAcceptingResponses ? "border-emerald-400/60 bg-emerald-500/20" : "border-white/10 bg-white/5"}`}>
                                <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${isAcceptingResponses ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                        </div>
                    </div>

                    {!isAcceptingResponses && (
                        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 shadow-sm">
                            Form duraklatıldı. Kullanıcılar bu formu yalnızca görüntüleyebilir ve nedenini belirten özel bir mesaj gösterilir.
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-semibold text-neutral-100">Anonim cevap izni</p>
                            <p className="text-[10px] text-neutral-500">Kimlik bilgisi olmadan gönderime izin ver.</p>
                        </div>
                        <button type="button" onClick={() => setAllowAnonymousResponses((prev) => !prev)} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${allowAnonymousResponses ? "border-emerald-400/60 bg-emerald-500/20" : "border-white/10 bg-white/5"}`}>
                            <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${allowAnonymousResponses ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
                        <div>
                            <p className="text-sm font-semibold text-neutral-100">Birden çok cevap izni</p>
                            <p className="text-[10px] text-neutral-500">Aynı kullanıcı yeniden gönderebilsin.</p>
                        </div>
                        <button type="button" onClick={() => setAllowMultipleResponses((prev) => !prev)} className={`relative inline-flex h-7 w-12 items-center rounded-full border px-1 transition ${allowMultipleResponses ? "border-emerald-400/60 bg-emerald-500/20" : "border-white/10 bg-white/5"}`}>
                            <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${allowMultipleResponses ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
