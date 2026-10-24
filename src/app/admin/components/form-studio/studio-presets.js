import { UNIVERSITIES } from "@/data/presets/universities";
import { DEPARTMENTS } from "@/data/presets/departments";

export const CHOICE_PRESETS = [
  { id: "universities", label: "Üniversite", data: UNIVERSITIES },
  { id: "departments", label: "Bölüm", data: DEPARTMENTS },
];

export const CHOICE_PRESET_LABELS = Object.fromEntries(CHOICE_PRESETS.map((preset) => [preset.id, preset.label]));

export const STARTER_TEMPLATES = [
  {
    id: "starter-identity",
    title: "Kimlik bilgileri",
    schema: [
      { id: "starter-name", type: "short_text", props: { question: "Adınız ve soyadınız", description: "", required: true, inputType: "name" } },
      { id: "starter-email", type: "short_text", props: { question: "E-posta adresiniz", description: "", required: true, inputType: "email" } },
    ],
  },
  {
    id: "starter-student",
    title: "Öğrenci bilgileri",
    schema: [
      { id: "starter-department", type: "combobox", props: { question: "Bölümünüz", description: "", required: true, allowCustom: false, choices: [...DEPARTMENTS], preset: "departments" } },
      {
        id: "starter-year",
        type: "combobox",
        props: { question: "Sınıfınız", description: "", required: true, allowCustom: false, choices: ["Hazırlık", "1. sınıf", "2. sınıf", "3. sınıf", "4. sınıf", "Yüksek lisans", "Doktora"], preset: null },
      },
      { id: "starter-number", type: "short_text", props: { question: "Öğrenci numaranız", description: "", required: true, inputType: "number" } },
    ],
  },
  {
    id: "starter-feedback",
    title: "Etkinlik geri bildirimi",
    schema: [
      { id: "starter-rating", type: "slider", props: { question: "Etkinliği nasıl buldunuz?", description: "1 en düşük, 10 en yüksek puan.", required: true, min: 1, max: 10, step: 1 } },
      { id: "starter-liked", type: "long_text", props: { question: "En çok neyi beğendiniz?", description: "", required: false } },
      { id: "starter-ideas", type: "long_text", props: { question: "Önerileriniz", description: "", required: false } },
    ],
  },
];

export function presetOf(choices) {
  const current = Array.isArray(choices) ? choices : [];
  return CHOICE_PRESETS.find((preset) => preset.data.length === current.length && preset.data.every((item, index) => item === current[index]))?.id ?? null;
}
