export const ATTEMPT_STATUS = { OPENED: 0, STARTED: 1, SUBMITTED: 2, PROVISIONAL: 3, NO_SUBMISSION: 4 };

export const ATTEMPT_EVENT = {
  OPENED: 0,
  STARTED: 1,
  EXTENDED: 2,
  EXPIRED: 3,
  ACCEPTED: 4,
  CLOSED: 5,
  REMINDED: 6,
  SUBMITTED: 7,
  EXPIRED_EMPTY: 8,
};

export const RESPONSE_STATUS_PROVISIONAL = 4;

export const ROW_STATUS = {
  submitted: { label: "Durumsuz", dot: "bg-neutral-600", text: "text-neutral-500" },
  pending: { label: "Beklemede", dot: "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/40", text: "text-amber-300" },
  approved: { label: "Onaylandı", dot: "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/40", text: "text-emerald-300" },
  declined: { label: "Reddedildi", dot: "bg-red-400 shadow-[0_0_6px] shadow-red-400/40", text: "text-red-300" },
  provisional: { label: "Geçici", dot: "border border-amber-400 bg-transparent", text: "text-amber-200" },
  running: { label: "Devam ediyor", dot: "bg-skylab-400 shadow-[0_0_6px] shadow-skylab-400/40", text: "text-skylab-300" },
  opened: { label: "Başlatmadı", dot: "border border-neutral-600 bg-transparent", text: "text-neutral-500" },
  none: { label: "Teslim yok", dot: "bg-red-400/50", text: "text-neutral-400" },
};

export function rowKindOf(row) {
  if (row?.status == null) {
    switch (row?.attempt?.status) {
      case ATTEMPT_STATUS.OPENED: return "opened";
      case ATTEMPT_STATUS.STARTED: return "running";
      default: return "none";
    }
  }

  switch (Number(row.status)) {
    case 1: return "pending";
    case 2: return "approved";
    case 3: return "declined";
    case RESPONSE_STATUS_PROVISIONAL: return "provisional";
    default: return "submitted";
  }
}

export function attemptKindOf(attempt) {
  switch (attempt?.status) {
    case ATTEMPT_STATUS.OPENED: return "opened";
    case ATTEMPT_STATUS.STARTED: return "running";
    case ATTEMPT_STATUS.PROVISIONAL: return "provisional";
    case ATTEMPT_STATUS.NO_SUBMISSION: return "none";
    default: return "submitted";
  }
}

export const STATUS_FILTERS = [
  { value: "all", label: "Hepsi", dot: null, count: (counts) => counts ? counts.submitted + counts.pending + counts.approved + counts.declined + counts.provisional + counts.running + counts.opened + counts.noSubmission : null },
  { value: "pending", label: "Beklemede", dot: "bg-amber-400", count: (counts) => counts?.pending, param: { status: 1 } },
  { value: "approved", label: "Onaylandı", dot: "bg-emerald-400", count: (counts) => counts?.approved, param: { status: 2 } },
  { value: "rejected", label: "Reddedildi", dot: "bg-red-400", count: (counts) => counts?.declined, param: { status: 3 } },
  { value: "provisional", label: "Geçici", dot: "border border-amber-400", count: (counts) => counts?.provisional, param: { status: RESPONSE_STATUS_PROVISIONAL }, timed: true },
  { value: "running", label: "Devam ediyor", dot: "bg-skylab-400", count: (counts) => counts?.running, param: { attemptStatus: ATTEMPT_STATUS.STARTED }, timed: true },
  { value: "opened", label: "Başlatmadı", dot: "border border-neutral-600", count: (counts) => counts?.opened, param: { attemptStatus: ATTEMPT_STATUS.OPENED }, timed: true },
  { value: "none", label: "Teslim yok", dot: "bg-red-400/50", count: (counts) => counts?.noSubmission, param: { attemptStatus: ATTEMPT_STATUS.NO_SUBMISSION }, timed: true },
];

export function statusFilterParams(value) {
  return STATUS_FILTERS.find((item) => item.value === value)?.param ?? {};
}
