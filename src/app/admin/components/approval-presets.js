import { ArrowRightLeft, Shredder, Workflow } from "lucide-react";

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

    "transfer-form": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: ArrowRightLeft,
        title: "Formun sahipliğini devret",
        highlights: (ctx) => [
            `Formun sahibi ${ctx.targetName} olur; siz editör olarak kalırsınız.`,
            "Formu silmek ve düzenleme ekibini yönetmek yeni sahibe geçer.",
            "Sahipliği yalnız yeni sahip geri devredebilir.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Devrediliyor..." : "Sahipliği devret",
        rejectLabel: () => "Vazgeç",
    },

    "transfer-group": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: ArrowRightLeft,
        title: "Şablonun sahipliğini devret",
        highlights: (ctx) => [
            `Şablonun sahibi ${ctx.targetName} olur ve şablon listenizden çıkar.`,
            "Şablonun açık paylaşım bağlantısı iptal edilir.",
            "Sahipliği yalnız yeni sahip geri devredebilir.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Devrediliyor..." : "Sahipliği devret",
        rejectLabel: () => "Vazgeç",
    },

    "transfer-workflow": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: ArrowRightLeft,
        title: "Akışın sahipliğini devret",
        highlights: (ctx) => [
            `Akışın sahibi ${ctx.targetName} olur ve akış listenizden çıkar.`,
            "Akıştaki formlarınızın sahipliği de ona geçer; siz bu formlarda editör olarak kalırsınız.",
            "Devam eden başvurular etkilenmez.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Devrediliyor..." : "Sahipliği devret",
        rejectLabel: () => "Vazgeç",
    },

    "transfer-orphaned": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: ArrowRightLeft,
        title: "Sahipsiz içeriği devret",
        highlights: (ctx) => [
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
        highlights: () => [],
        approveLabel: (ctx) => ctx.isPending ? "İşleniyor..." : "Onayla",
        rejectLabel: () => "İptal",
    },
};
