export const CLUB_CONSOLES = [
  {
    id: "admin",
    label: "Yönetim",
    description: "Üyeler, etkinlikler, duyurular",
    href: process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.yildizskylab.com",
  },
  {
    id: "forms",
    label: "Forms",
    description: "Formlar ve başvurular",
    href: process.env.NEXT_PUBLIC_FORMS_ADMIN_URL || "https://forms.yildizskylab.com/admin",
  },
  {
    id: "mail",
    label: "Mail",
    description: "Toplu e-posta ve listeler",
    href: process.env.NEXT_PUBLIC_MAIL_URL || "https://notify.yildizskylab.com",
  },
];

export function clubSwitcherLinks(current) {
  return CLUB_CONSOLES.filter((app) => app.id !== current);
}
