import { Link, Shredder, Unlink } from "lucide-react";

export const APPROVAL_PRESETS = {
    "link-add": {
        variant: "delayed",
        delaySeconds: 6,
        requiredPhrase: "Onaylıyorum",
        icon: Link,
        title: "Form bağlama işlemini onayla",
        highlights: () => [
            "Bu form, seçtiğiniz form ile ilişkilendirilecek.",
            "Bu forma ait ayarlar ve düzenleme ekibi bağlı forma aktarılacak ve form bağlantıları koparılana kadar senkronize edilecektir.",
            "Kullanıcılar bu formu doldurduktan sonra verilen cevap onaylanırsa otomatik olarak bağlı forma yönlendirilecektir.",
            "Bağlantıyı daha sonra ayarlar bölümünden kaldırabilir veya değiştirebilirsiniz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Bağlanıyor..." : "Bağlantıyı onayla",
        rejectLabel: () => "Vazgeç",
    },

    "link-change": {
        variant: "delayed",
        delaySeconds: 6,
        requiredPhrase: "Onaylıyorum",
        icon: Link,
        title: "Form bağlantısını değiştirmeyi onayla",
        highlights: () => [
            "Bu formun mevcut bağlantısı yeni seçilen forma yönlendirilecek.",
            "Eski bağlantıya bağlı akışlar artık yeni forma göre çalışacak.",
            "Bağlantıyı tekrar ayarlar bölümünden değiştirebilirsiniz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Güncelleniyor..." : "Bağlantıyı değiştir",
        rejectLabel: () => "Vazgeç",
    },

    "link-remove": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: Unlink,
        title: "Form bağlantısını kaldırmayı onayla",
        highlights: () => [
            "Bu işlemden sonra kullanıcılar bu formu doldurduğunda başka bir forma yönlendirilmeyecek.",
            "Akış mantığınız bağlantı üzerinden çalışıyorsa etkilenebilir.",
            "Dilerseniz daha sonra farklı bir forma yeniden bağlantı kurabilirsiniz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Kaldırılıyor..." : "Bağlantıyı kaldır",
        rejectLabel: () => "Vazgeç",
    },

    "delete-form": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: Shredder,
        title: "Formu kalıcı olarak sil",
        highlights: () => [
            "Bu forma bağlı akışlar (bağlı formlar vb.) boşa düşecektir.",
            "Form yanıtları ve istatistikleri kalıcı olarak kaybedilecektir.",
            "Form silme işlemi geri alınamaz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Siliniyor..." : "Formu sil",
        rejectLabel: () => "İptal",
    },

    default: {
        variant: "phrase",
        requiredPhrase: "Onaylıyorum",
        title: "Onay gerekiyor",
        description: () => "Devam etmek için bu işlemi onaylamanız gerekiyor.",
        highlights: () => [],
        approveLabel: (ctx) => ctx.isPending ? "İşleniyor..." : "Onaylıyorum",
        rejectLabel: () => "İptal",
    },
};
