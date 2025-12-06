import { CreateFormShortText, DisplayFormShortText }      from "@/app/components/form-components/FormShortText";
import { CreateFormLongText, DisplayFormLongText }        from "@/app/components/form-components/FormLongText";
import { CreateFormCombobox, DisplayFormCombobox }        from "@/app/components/form-components/FormCombobox";
import { CreateFormMultiChoice, DisplayFormMultiChoice }  from "@/app/components/form-components/FormMultiChoice";
import { CreateFormDatePicker, DisplayFormDatePicker }    from "@/app/components/form-components/FormDatePicker";
import { CreateFormTimePicker, DisplayFormTimePicker }    from "@/app/components/form-components/FormTimePicker";
import { CreateFormFileUpload, DisplayFormFileUpload }    from "@/app/components/form-components/FormFileUpload";
import { CreateFormLink, DisplayFormLink }                from "@/app/components/form-components/FormLink";

export const REGISTRY = {
  short_text: {
    label: "Kısa Yanıt",
    svg: "/assets/components/short-text.svg",
    defaults: { question:"", description:"", required:false },
    Create: CreateFormShortText, Display: DisplayFormShortText
  },
  long_text: {
    label: "Uzun Yanıt",
    svg: "/assets/components/long-text.svg",
    defaults: { question:"", description:"", required:false },
    Create: CreateFormLongText, Display: DisplayFormLongText
  },
  combobox: {
    label: "Açılır Liste",
    svg: "/assets/components/combobox.svg",
    defaults: { question:"", description:"", required:false, allowCustom:false, choices:["Seçenek 1","Seçenek 2"] },
    Create: CreateFormCombobox, Display: DisplayFormCombobox
  },
  multi_choice: {
    label: "Çoklu Seçim",
    svg: "/assets/components/multi-choice.svg",
    defaults: { question:"", description:"", required:false, choices:["Seçenek 1","Seçenek 2"] },
    Create: CreateFormMultiChoice, Display: DisplayFormMultiChoice
  },
  date: {
    label: "Tarih",
    svg: "/assets/components/date-picker.svg",
    defaults: { question:"", description:"", required:false },
    Create: CreateFormDatePicker, Display: DisplayFormDatePicker
  },
  time: {
    label: "Saat",
    svg: "/assets/components/time-picker.svg",
    defaults: { question:"", description:"", required:false },
    Create: CreateFormTimePicker, Display: DisplayFormTimePicker
  },
  file: {
    label: "Dosya",
    svg: "/assets/components/file-upload.svg",
    defaults: { question:"", description:"", required:false, acceptedFiles:".pdf,.jpg,.png", maxSize:0 },
    Create: CreateFormFileUpload, Display: DisplayFormFileUpload
  },
  link: {
    label: "Bağlantı",
    svg: "/assets/components/link.svg",
    defaults: { question:"", description:"", required:false, allowMultiple:false },
    Create: CreateFormLink, Display: DisplayFormLink
  }
};

export const COMPONENTS = [
  { type: "short_text",  label: "Kısa Yanıt",   svg: "/assets/components/short-text.svg" },
  { type: "long_text",   label: "Uzun Yanıt",   svg: "/assets/components/long-text.svg" },
  { type: "combobox",    label: "Açılır Liste", svg: "/assets/components/combobox.svg" },
  { type: "multi_choice",label: "Çoklu Seçim",  svg: "/assets/components/multi-choice.svg" },
  { type: "date",        label: "Tarih",        svg: "/assets/components/date-picker.svg" },
  { type: "time",        label: "Saat",         svg: "/assets/components/time-picker.svg" },
  { type: "file",        label: "Dosya",        svg: "/assets/components/file-upload.svg" },
  { type: "link",        label: "Bağlantı",     svg: "/assets/components/link.svg" },
];