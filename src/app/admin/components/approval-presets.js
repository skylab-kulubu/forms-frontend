import { Shredder, Workflow } from "lucide-react";

export const APPROVAL_PRESETS = {
    "publish-workflow": {
        variant: "delayed",
        delaySeconds: 2,
        icon: Workflow,
        title: "Akışı yayınla",
        highlights: (ctx) => ctx.highlights ?? [],
        approveLabel: (ctx) => ctx.isPending ? "Yayınlanıyor..." : "Yayınla",
        rejectLabel: () => "Vazgeç",
    },

    "close-workflow": {
        variant: "delayed",
        delaySeconds: 2,
        icon: Workflow,
        title: "Akışı kapat",
        highlights: (ctx) => [
            "Akıştaki bütün adımlar cevap almayı bırakır; yeni başvuru da başlatılamaz.",
            ctx.activeRunCount > 0
                ? `Devam eden ${ctx.activeRunCount} başvuru, akış yeniden açılana kadar bekler.`
                : "Devam eden başvurular, akış yeniden açılana kadar bekler.",
            "İnceleyenler bekleyen cevaplar için karar vermeye devam edebilir.",
            "Tamamlanan başvuruların sonucu görünmeye devam eder.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Kapatılıyor..." : "Akışı kapat",
        rejectLabel: () => "Vazgeç",
    },

    "archive-workflow": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: Workflow,
        title: "Bu akışı arşivle",
        highlights: () => [
            "Akış yayından kalkar, yeni başvuru başlatılamaz.",
            "Devam eden başvurular bulundukları sürümde kalmaya devam eder.",
            "Akıştaki formlar ve cevapları silinmez.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Arşivleniyor..." : "Akışı arşivle",
        rejectLabel: () => "Vazgeç",
    },

    "delete-form": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: Shredder,
        title: "Bu formu kalıcı olarak sil",
        highlights: () => [
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
        title: "Bu şablonu kalıcı olarak sil",
        highlights: () => [
            "Bu şablona ait tüm bileşenler kalıcı olarak silinecek.",
            "Bu şablonu kullanan formlar etkilenebilir.",
            "Bu işlem geri alınamaz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Siliniyor..." : "Şablonu sil",
        rejectLabel: () => "İptal",
    },

    default: {
        variant: "phrase",
        requiredPhrase: "Onaylıyorum",
        title: "Onay gerekiyor",
        description: () => "Devam etmek için bu işlemi onaylamanız gerekiyor.",
        highlights: () => [],
        approveLabel: (ctx) => ctx.isPending ? "İşleniyor..." : "Onayla",
        rejectLabel: () => "İptal",
    },
};
