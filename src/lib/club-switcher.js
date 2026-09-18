export function clubSwitcherLinks(current) {
  const consoles = [
    {
      id: "admin",
      label: "Yönetim",
      href: process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.yildizskylab.com",
    },
    {
      id: "forms",
      label: "Forms",
      href: process.env.NEXT_PUBLIC_FORMS_ADMIN_URL || "https://forms.yildizskylab.com/admin",
    },
    {
      id: "mail",
      label: "Mail",
      href: process.env.NEXT_PUBLIC_MAIL_URL || "https://mail.yildizskylab.com",
    },
  ];
  return consoles.filter((app) => app.id !== current);
}
