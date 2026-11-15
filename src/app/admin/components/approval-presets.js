import { Archive, ArrowRightLeft, Shredder, Workflow } from "lucide-react";

// consequences fill ConfirmDialog's "Ne olacak" list and unaffected its "Ne kalacak" list
export const APPROVAL_PRESETS = {
    "publish-workflow": {
        variant: "delayed",
        delaySeconds: 2,
        icon: Workflow,
        title: "Akışı başvurulara aç",
        consequences: (ctx) => ctx.highlights ?? [],
        approveLabel: (ctx) => ctx.isPending ? "Kaydediliyor..." : "Kaydet ve aç",
        rejectLabel: () => "Vazgeç",
    },

    "close-workflow": {
        variant: "delayed",
        delaySeconds: 2,
        icon: Workflow,
        title: "Akışı kapat",
        consequences: (ctx) => [
            "Akıştaki bütün adımlar cevap almayı bırakır; yeni başvuru da başlatılamaz.",
            ctx.activeRunCount > 0
                ? `Devam eden ${ctx.activeRunCount} başvuru, akış yeniden açılana kadar bekler.`
                : "Devam eden başvurular, akış yeniden açılana kadar bekler.",
        ],
        unaffected: () => [
            "İnceleyenler bekleyen cevaplar için karar vermeye devam edebilir.",
            "Tamamlanan başvuruların sonucu görünmeye devam eder.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Kapatılıyor..." : "Akışı kapat",
        rejectLabel: () => "Vazgeç",
    },

    "archive-workflow": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: Archive,
        title: "Bu akışı arşivle",
        consequences: () => [
            "Akış yayından kalkar, yeni başvuru başlatılamaz.",
            "Başvuranı bekleyen başvurular durur; onay bekleyen cevaplar yine incelenebilir.",
        ],
        unaffected: () => [
            "Akıştaki formlar ve cevapları silinmez.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Arşivleniyor..." : "Akışı arşivle",
        rejectLabel: () => "Vazgeç",
    },

    "delete-form": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: Shredder,
        destructive: true,
        title: "Bu formu kalıcı olarak sil",
        consequences: () => [
            "Tüm yanıtlar ve istatistikler kalıcı olarak silinecek.",
            "Bu işlem geri alınamaz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Siliniyor..." : "Formu sil",
        rejectLabel: () => "İptal",
    },

    "delete-group": {
        variant: "delayed",
        delaySeconds: 1,
        requiredPhrase: "Kabul ediyorum",
        icon: Shredder,
        destructive: true,
        title: "Bu şablonu kalıcı olarak sil",
        consequences: () => [
            "Bu şablona ait tüm bileşenler kalıcı olarak silinecek.",
            "Bu işlem geri alınamaz.",
        ],
        unaffected: () => [
            "Bu şablondan soru eklenmiş formlar değişmez.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Siliniyor..." : "Şablonu sil",
        rejectLabel: () => "İptal",
    },

    // Red like the Devret button that opens it: only the new owner can hand it back
    "transfer-form": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: ArrowRightLeft,
        destructive: true,
        title: "Formun sahipliğini devret",
        consequences: (ctx) => [
            `Formun sahibi ${ctx.targetName} olur; siz editör olarak kalırsınız.`,
            "Formu silmek ve düzenleme ekibini yönetmek yeni sahibe geçer.",
            "Sahipliği yalnız yeni sahip geri devredebilir.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Devrediliyor..." : "Sahipliği devret",
        rejectLabel: () => "Vazgeç",
    },

    "transfer-workflow": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: ArrowRightLeft,
        destructive: true,
        title: "Akışın sahipliğini devret",
        consequences: (ctx) => [
            `Akışın sahibi ${ctx.targetName} olur ve akış listenizden çıkar.`,
            "Akıştaki formlarınızın sahipliği de ona geçer; siz bu formlarda editör olarak kalırsınız.",
        ],
        unaffected: () => [
            "Devam eden başvurular etkilenmez.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Devrediliyor..." : "Sahipliği devret",
        rejectLabel: () => "Vazgeç",
    },

    "transfer-orphaned": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: ArrowRightLeft,
        destructive: true,
        title: "Sahipsiz içeriği devret",
        consequences: (ctx) => [
            `${ctx.itemLabel} ${ctx.targetName} kişisine geçer; hesabı silinen sahibin yetkileri onun olur.`,
            ...(ctx.kind === "workflow" ? ["Akıştaki sahipsiz formlar da akışla birlikte geçer."] : []),
            "Sahipliği bundan sonra yalnız yeni sahip devredebilir.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Devrediliyor..." : "Sahipliği devret",
        rejectLabel: () => "Vazgeç",
    },

    default: {
        variant: "phrase",
        requiredPhrase: "Onaylıyorum",
        title: "Onay gerekiyor",
        description: () => "Devam etmek için bu işlemi onaylamanız gerekiyor.",
        consequences: () => [],
        approveLabel: (ctx) => ctx.isPending ? "İşleniyor..." : "Onayla",
        rejectLabel: () => "İptal",
    },
};
