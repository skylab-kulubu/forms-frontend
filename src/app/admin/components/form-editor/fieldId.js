export function genFieldId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID().slice(0, 8);
    }
    return Math.random().toString(36).slice(2, 10);
}
