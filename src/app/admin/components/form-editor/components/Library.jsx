import { useState } from "react";
import { COMPONENTS } from "@/app/components/form-registry";
import { LibraryPanel, LibraryItem } from "./LibraryComponents";
import { LibrarySettings } from "./LibrarySettings";
import dynamic from "next/dynamic";

const LibraryTipTap = dynamic(() => import("./LibraryTipTap").then((mod) => mod.LibraryTipTap), { ssr: false });

export function Library({layout = "grid", formState, formActions, onLibrarySelect, isPending, isError, isSuccess, shareStatus, currentUserRole, isDeleteDisabled }) {
    const [activeTab, setActiveTab] = useState("components");
    
    const { 
        schema, description, editors, status, linkedFormId, 
        allowAnonymousResponses, allowMultipleResponses, 
        newEditor, newEditorRole, linkableForms, isChildForm 
    } = formState;

    const { 
        setDescription, handleSave, onRefresh, onShare, handleDeleteRequest,
        handleAddEditor, handleRemoveEditor, handleChangeEditorRole, 
        setNewEditor, setNewEditorRole, setLinkedFormId, 
        setStatus, setAllowAnonymousResponses, setAllowMultipleResponses 
    } = formActions;

    const renderContent = () => {
        switch (activeTab) {
            case "components":
                return (
                    <div className="grid grid-cols-1 gap-2 p-2 space-y-1">
                        {COMPONENTS.map((component) => (
                            <LibraryItem key={component.type} item={component} layout={layout} onSelect={onLibrarySelect}/>
                        ))}
                    </div>
                );
            
            case "settings":
                return (
                    <div className="relative h-full">
                        <div className={isChildForm ? "pointer-events-none opacity-40" : ""}>
                            <LibrarySettings editors={editors} onChangeEditorRole={handleChangeEditorRole} 
                                handleAddEditor={handleAddEditor} handleRemoveEditor={handleRemoveEditor} 
                                newEditor={newEditor} setNewEditor={setNewEditor} newEditorRole={newEditorRole} 
                                setNewEditorRole={setNewEditorRole} setLinkedFormId={setLinkedFormId}
                                linkedFormId={linkedFormId} status={status} allowAnonymousResponses={allowAnonymousResponses}
                                setAllowAnonymousResponses={setAllowAnonymousResponses} setStatus={setStatus} 
                                allowMultipleResponses={allowMultipleResponses} setAllowMultipleResponses={setAllowMultipleResponses} 
                                linkableForms={linkableForms ?? []} currentUserRole={currentUserRole}
                            />
                        </div>
                        {isChildForm && (
                            <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
                                <div className="mx-4 max-w-xs rounded-lg border border-neutral-700 bg-neutral-900/90 px-4 py-3 text-center shadow-lg">
                                    <p className="mb-1 text-sm font-semibold text-neutral-500 uppercase tracking-wide">Ayarlar kilitli</p>
                                    <p className="text-[11px] leading-relaxed text-neutral-300">Bu formun ayarları ana form tarafından yönetilmektedir.</p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case "description":
                return (
                    <div className="flex h-full min-h-0 flex-col gap-4 p-4 text-sm text-neutral-200">
                        <section className="flex flex-1 min-h-0 flex-col gap-4">
                            <div>
                                <p className="font-semibold text-neutral-100">Form açıklaması</p>
                                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
                                    Formu görüntüleyen kişiler için kısa bir açıklama ekleyin.
                                </p>
                            </div>
                            <div className="flex-1 min-h-0">
                                <LibraryTipTap value={description} onChange={setDescription} />
                            </div>
                        </section>
                    </div>
                );
                
            default:
                return null;
        }
    };

    return (
        <LibraryPanel activeTab={activeTab} onSelectTab={setActiveTab} handleSave={handleSave}
            onRefresh={onRefresh} onShare={onShare} showShare={true} shareStatus={shareStatus} 
            onDelete={handleDeleteRequest} isDeleteDisabled={isDeleteDisabled}
            isPending={isPending} isSuccess={isSuccess} isError={isError} layout={layout}
        >
            {renderContent()}
        </LibraryPanel>
    );
}