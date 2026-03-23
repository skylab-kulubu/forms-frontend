import { Link, Shredder, Unlink } from "lucide-react";

export const APPROVAL_PRESETS = {
    "link-add": {
        variant: "delayed",
        delaySeconds: 3,
        requiredPhrase: "Onaylıyorum",
        icon: Link,
        title: "Bu formu başka bir formla bağla",
        highlights: () => [
            "Seçtiğiniz formla kalıcı bir bağlantı kurulacak.",
            "Ayarlar ve düzenleme ekibi bağlı forma aktarılacak, bağlantı koparılana kadar senkronize kalacak.",
            "Kullanıcılar bu formu doldurup cevabı onaylandığında otomatik olarak bağlı forma yönlendirilecek.",
            "Bu bağlantıyı istediğiniz zaman ayarlardan kaldırabilir veya değiştirebilirsiniz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Bağlanıyor..." : "Bağlantıyı kur",
        rejectLabel: () => "Vazgeç",
    },

    "link-change": {
        variant: "delayed",
        delaySeconds: 3,
        requiredPhrase: "Onaylıyorum",
        icon: Link,
        title: "Bağlı formu değiştir",
        highlights: () => [
            "Mevcut bağlantı kaldırılıp yeni seçilen forma yönlendirilecek.",
            "Eski bağlantıya dayanan akışlar bundan sonra yeni forma göre çalışacak.",
            "Değişikliği istediğiniz zaman ayarlardan geri alabilirsiniz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Güncelleniyor..." : "Bağlantıyı değiştir",
        rejectLabel: () => "Vazgeç",
    },

    "link-remove": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: Unlink,
        title: "Form bağlantısını kaldır",
        highlights: () => [
            "Kullanıcılar bu formu doldurduktan sonra artık başka bir forma yönlendirilmeyecek.",
            "Bağlantıya dayalı akışlarınız varsa bunlar devre dışı kalabilir.",
            "İstediğiniz zaman yeni bir bağlantı kurabilirsiniz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Kaldırılıyor..." : "Bağlantıyı kaldır",
        rejectLabel: () => "Vazgeç",
    },

    "delete-form": {
        variant: "phrase",
        requiredPhrase: "Kabul ediyorum",
        icon: Shredder,
        title: "Bu formu kalıcı olarak sil",
        highlights: () => [
            "Bağlı formlar ve akışlar devre dışı kalacak.",
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

    "anonymous-toggle": {
        variant: "delayed",
        delaySeconds: 3,
        requiredPhrase: "Onaylıyorum",
        title: "Anonim yanıtları etkinleştir",
        icon: Unlink,
        highlights: () => [
            "Anonim yanıtlar açıldığında mevcut form bağlantısı otomatik olarak kaldırılacak.",
            "Kullanıcı kimliği toplanmayacağından kişiye özel akışlar çalışmayabilir.",
            "Bu ayarı istediğiniz zaman geri kapatabilirsiniz.",
        ],
        approveLabel: (ctx) => ctx.isPending ? "Etkinleştiriliyor..." : "Anonim yanıtları aç",
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
