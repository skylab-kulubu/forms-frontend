// Hesabı silinen herkesin yerine yazılan ortak kimlik (core hesap silme sözleşmesi §8); kişiye ait olmadığı için
// ekranda kimlik olarak gösterilmez.
export const DELETED_USER_ID = "00000000-0000-4000-8000-000000000000";

export const isDeletedUser = (id) => id === DELETED_USER_ID;
