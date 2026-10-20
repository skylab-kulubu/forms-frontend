export const HOME_PATHS = {
  kisiler: "/",
  topluluklar: "/topluluklar",
};

export const HOME_FORMS = {
  trial: process.env.NEXT_PUBLIC_HOME_TRIAL_FORM?.trim() || "",
  interest: process.env.NEXT_PUBLIC_HOME_INTEREST_FORM?.trim() || "",
  access: process.env.NEXT_PUBLIC_HOME_ACCESS_FORM?.trim() || "",
};

export const TRIAL_ALIAS = "forms-deneme";

export const SECTIONS = {
  kisiler: { top: "afisler", after: "basvurduktan-sonra", interest: "ilgi-alanlari" },
  topluluklar: {
    top: "afis",
    review: "degerlendirme",
    flow: "akislar",
    editor: "form-editoru",
    compare: "google-forms",
    access: "erisim",
  },
};
