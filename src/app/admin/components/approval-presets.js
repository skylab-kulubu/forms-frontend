import { Shredder } from "lucide-react";

export const APPROVAL_PRESETS = {
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
        title: "Bu bileşen grubunu kalıcı olarak sil",
        highlights: () => [
            "Bu gruba ait tüm bileşenler kalıcı olarak silinecek.",
            "Bu grubu kullanan formlar etkilenebilir.",
            "Bu işlem geri alınamaz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Siliniyor..." : "Grubu sil",
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
