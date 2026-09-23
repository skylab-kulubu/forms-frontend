export const COMPARISON = {
  EQUALS: 0, NOT_EQUALS: 1, IN: 2, NOT_IN: 3, CONTAINS: 4,
  GREATER_THAN: 5, GREATER_OR_EQUAL: 6, LESS_THAN: 7, LESS_OR_EQUAL: 8,
  IS_EMPTY: 9, IS_NOT_EMPTY: 10,
};

export const COMPARISON_LABEL = {
  0: "eşittir",
  1: "eşit değildir",
  2: "şunlardan biri",
  3: "şunlardan biri değil",
  4: "içerir",
  5: "büyüktür",
  6: "en az",
  7: "küçüktür",
  8: "en fazla",
  9: "boş",
  10: "dolu",
};

export const COMPARISON_SYMBOL = {
  0: "=",
  1: "≠",
  2: "∈",
  3: "∉",
  4: "içerir",
  5: ">",
  6: "≥",
  7: "<",
  8: "≤",
  9: "boş",
  10: "dolu",
};

export const VALUELESS_COMPARISONS = [COMPARISON.IS_EMPTY, COMPARISON.IS_NOT_EMPTY];
export const MULTI_VALUE_COMPARISONS = [COMPARISON.IN, COMPARISON.NOT_IN];

const TEXT_COMPARISONS = [COMPARISON.CONTAINS, COMPARISON.IS_EMPTY, COMPARISON.IS_NOT_EMPTY];
const PRESENCE_COMPARISONS = [COMPARISON.IS_EMPTY, COMPARISON.IS_NOT_EMPTY];

export const COMPARISONS_BY_TYPE = {
  combobox: [COMPARISON.EQUALS, COMPARISON.NOT_EQUALS, COMPARISON.IN, COMPARISON.NOT_IN],
  multi_choice: [COMPARISON.IN, COMPARISON.NOT_IN, COMPARISON.CONTAINS],
  toggle: [COMPARISON.EQUALS],
  slider: [COMPARISON.GREATER_THAN, COMPARISON.GREATER_OR_EQUAL, COMPARISON.LESS_THAN, COMPARISON.LESS_OR_EQUAL],
  short_text: TEXT_COMPARISONS,
  long_text: TEXT_COMPARISONS,
  date: [COMPARISON.EQUALS, ...PRESENCE_COMPARISONS],
  time: [COMPARISON.EQUALS, ...PRESENCE_COMPARISONS],
  file: PRESENCE_COMPARISONS,
  matrix: PRESENCE_COMPARISONS,
  repeater: PRESENCE_COMPARISONS,
};

export const CONDITIONABLE_TYPES = Object.keys(COMPARISONS_BY_TYPE);

export function comparisonsForField(field) {
  return COMPARISONS_BY_TYPE[field?.type] ?? TEXT_COMPARISONS;
}

export function fieldQuestionLabel(field) {
  const question = field?.props?.question?.trim();
  return question || "Metinsiz soru";
}

/**
 * Cevaplar seçeneğin görünen metniyle saklanıyor, o yüzden koşulun değeri de
 * etiketin kendisi olmalı (id değil).
 */
export function optionsForField(field) {
  if (!field) return [];

  if (field.type === "toggle") {
    return [field.props?.trueLabel || "Evet", field.props?.falseLabel || "Hayır"];
  }

  if (field.type === "combobox" || field.type === "multi_choice") {
    const choices = Array.isArray(field.props?.choices) ? field.props.choices : [];
    return choices.map((choice, index) => (typeof choice === "string" ? choice : String(choice?.label ?? choice?.value ?? `Seçenek ${index + 1}`)));
  }

  return [];
}

export const VALIDATION_COPY = {
  emptyGraph: { message: "Akışta hiç adım yok. Önce bir form ekleyin." },
  startNodeMissing: { message: "Başlangıç adımı seçilmemiş." },
  startNodeAmbiguous: { message: "Birden fazla adım başlangıç olarak işaretlenmiş." },
  nodeKeyMissing: { message: "Bir adımın anahtarı boş kalmış." },
  nodeKeyTooLong: { message: "Adım anahtarı çok uzun." },
  nodeKeyDuplicated: { message: "İki adım aynı anahtarı kullanıyor." },
  formDuplicated: { message: "Aynı form iki ayrı adım olarak eklenmiş." },
  transitionSourceMissing: { message: "Bir yönlendirme, akışta olmayan bir adımdan başlıyor." },
  transitionTargetMissing: { message: "Bir yönlendirme, akışta olmayan bir adımı gösteriyor." },
  cycleDetected: { message: "Akış kendi üzerine dönüyor." },
  nodeUnreachable: { message: "Bu adıma başlangıçtan ulaşan bir yol yok." },
  depthExceeded: { message: "Bu adımdan geçen rota üç formdan uzun." },
  triggerNotAllowed: { message: "Yönlendirme, adımın manuel onay ayarıyla uyuşmuyor." },
  defaultRouteMissing: { message: "Koşullu yönlendirmelerin bir \"aksi halde\" yolu yok.", action: "addDefaultRoute" },
  defaultRouteDuplicated: { message: "Aynı tetikleyicide iki koşulsuz yönlendirme var." },
  priorityDuplicated: { message: "İki yönlendirme aynı sırada." },
  conditionQuestionMissing: { message: "Bir koşul, formda olmayan bir soruyu okuyor." },
  conditionNodeMissing: { message: "Bir koşul, akışta olmayan bir adımı okuyor." },
  conditionNodeNotGuaranteed: { message: "Koşul, bazı rotaların atladığı bir adımı okuyor." },
  conditionValueMissing: { message: "Bir koşulun karşılaştırma değeri boş." },
  formMissing: { message: "Bu adımın formu silinmiş.", action: "openForm" },
  formClosed: { message: "Bu adımın formu cevap kabul etmiyor.", action: "openForm" },
  formAnonymous: { message: "Bu adımın formu anonim cevaba açık. Akışlar imzalı kullanıcı ister.", action: "openForm" },
  formNotOwned: { message: "Bu formun sahibi değilsiniz.", action: "openForm" },
  formInAnotherWorkflow: { message: "Bu form başka bir yayındaki akışta kullanılıyor." },
  formIsLegacyLinked: { message: "Bu form hâlâ eski bağlı form eşleşmesinde." },
};

export function validationMessage(issue) {
  return VALIDATION_COPY[issue?.code]?.message ?? issue?.message ?? "Tanımda bir sorun var.";
}

export function validationAction(issue) {
  return VALIDATION_COPY[issue?.code]?.action ?? null;
}

export const CONNECTION_COPY = {
  cycle: { hint: "döngü oluşturur", message: "Bu bağlantı döngü oluşturur" },
  depth: { hint: "rota üç formu aşar", message: "Bu bağlantıyla rota üç formu aşar" },
};

export const ELIGIBILITY_COPY = {
  formClosed: "Cevap kabul etmiyor",
  formAnonymous: "Anonim cevaba açık",
  formNotOwned: "Sahibi değilsiniz",
  formInAnotherWorkflow: "Başka bir akışta",
  formIsLegacyLinked: "Eski bağlı form eşleşmesinde",
  formMissing: "Form bulunamadı",
};

export function eligibilityReason(reason) {
  return ELIGIBILITY_COPY[reason] ?? "Bu akışta kullanılamaz";
}
