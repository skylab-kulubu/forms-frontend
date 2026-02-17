import { CreateFormShortText, DisplayFormShortText } from "@/app/components/form-components/FormShortText";
import { CreateFormLongText, DisplayFormLongText } from "@/app/components/form-components/FormLongText";
import { CreateFormCombobox, DisplayFormCombobox } from "@/app/components/form-components/FormCombobox";
import { CreateFormMultiChoice, DisplayFormMultiChoice } from "@/app/components/form-components/FormMultiChoice";
import { CreateFormDatePicker, DisplayFormDatePicker } from "@/app/components/form-components/FormDatePicker";
import { CreateFormTimePicker, DisplayFormTimePicker } from "@/app/components/form-components/FormTimePicker";
import { CreateFormFileUpload, DisplayFormFileUpload } from "@/app/components/form-components/FormFileUpload";
import { CreateFormLink, DisplayFormLink } from "@/app/components/form-components/FormLink";
import { CreateFormSlider, DisplayFormSlider } from "@/app/components/form-components/FormSlider";
import { CreateFormMatrix, DisplayFormMatrix } from "@/app/components/form-components/FormMatrix";
import { CreateFormToggle, DisplayFormToggle } from "@/app/components/form-components/FormToggle";

import { Type, AlignLeft, ChevronsUpDown, ListChecks, Calendar, Clock, Paperclip, Link, SlidersHorizontal, Grid3X3, ToggleRight } from "lucide-react";

export const REGISTRY = {
  short_text: {
    label: "Kısa Yanıt",
    svg: "/assets/components/short-text.svg",
    defaults: { question: "", description: "", required: false, inputType: "text" },
    Create: CreateFormShortText, Display: DisplayFormShortText
  },
  long_text: {
    label: "Uzun Yanıt",
    svg: "/assets/components/long-text.svg",
    defaults: { question: "", description: "", required: false },
    Create: CreateFormLongText, Display: DisplayFormLongText
  },
  toggle: {
    label: "Anahtar",
    svg: "/assets/components/toggle.svg",
    defaults: { question: "", description: "", required: false, trueLabel: "Evet", falseLabel: "Hayır" },
    Create: CreateFormToggle, Display: DisplayFormToggle
  },
  combobox: {
    label: "Açılır Liste",
    svg: "/assets/components/combobox.svg",
    defaults: { question: "", description: "", required: false, allowCustom: false, choices: ["Seçenek 1", "Seçenek 2"] },
    Create: CreateFormCombobox, Display: DisplayFormCombobox
  },
  multi_choice: {
    label: "Çoklu Seçim",
    svg: "/assets/components/multi-choice.svg",
    defaults: { question: "", description: "", required: false, choices: ["Seçenek 1", "Seçenek 2"] },
    Create: CreateFormMultiChoice, Display: DisplayFormMultiChoice
  },
  date: {
    label: "Tarih",
    svg: "/assets/components/date-picker.svg",
    defaults: { question: "", description: "", required: false },
    Create: CreateFormDatePicker, Display: DisplayFormDatePicker
  },
  time: {
    label: "Saat",
    svg: "/assets/components/time-picker.svg",
    defaults: { question: "", description: "", required: false },
    Create: CreateFormTimePicker, Display: DisplayFormTimePicker
  },
  file: {
    label: "Dosya",
    svg: "/assets/components/file-upload.svg",
    defaults: { question: "", description: "", required: false, acceptedFiles: ".pdf,.jpg,.png", maxSize: 0 },
    Create: CreateFormFileUpload, Display: DisplayFormFileUpload
  },
  link: {
    label: "Bağlantı",
    svg: "/assets/components/link.svg",
    defaults: { question: "", description: "", required: false, allowMultiple: false },
    Create: CreateFormLink, Display: DisplayFormLink
  },
  slider: {
    label: "Aralık",
    svg: "/assets/components/slider.svg",
    defaults: { question: "", description: "", required: false, min: 0, max: 100, step: 1 },
    Create: CreateFormSlider, Display: DisplayFormSlider
  },
  matrix: {
    label: "Matris / Tablo",
    svg: "/assets/components/matrix.svg",
    defaults: { question: "", description: "", required: false, rows: ["Satır 1", "Satır 2", "Satır 3"], columns: ["Sütun 1", "Sütun 2", "Sütun 3"] },
    Create: CreateFormMatrix, Display: DisplayFormMatrix
  }
};

export const COMPONENTS = [
  { type: "short_text", label: "Kısa Yanıt", svg: "/assets/components/short-text.svg", icon: Type },
  { type: "long_text", label: "Uzun Yanıt", svg: "/assets/components/long-text.svg", icon: AlignLeft },
  { type: "toggle", label: "Aç / Kapat", svg: "/assets/components/multi-choice.svg", icon: ToggleRight },
  { type: "combobox", label: "Açılır Liste", svg: "/assets/components/combobox.svg", icon: ChevronsUpDown },
  { type: "multi_choice", label: "Çoklu Seçim", svg: "/assets/components/multi-choice.svg", icon: ListChecks },
  { type: "date", label: "Tarih", svg: "/assets/components/date-picker.svg", icon: Calendar },
  { type: "time", label: "Saat", svg: "/assets/components/time-picker.svg", icon: Clock },
  { type: "file", label: "Dosya", svg: "/assets/components/file-upload.svg", icon: Paperclip },
  { type: "link", label: "Bağlantı", svg: "/assets/components/link.svg", icon: Link },
  { type: "slider", label: "Aralık (Slider)", svg: "/assets/components/short-text.svg", icon: SlidersHorizontal },
  { type: "matrix", label: "Matris Tablo", svg: "/assets/components/multi-choice.svg", icon: Grid3X3 },
];