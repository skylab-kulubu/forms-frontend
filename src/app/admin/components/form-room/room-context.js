"use client";

import { createContext, useCallback, useContext, useEffect } from "react";

export const RoomContext = createContext(null);

export function useRoom() {
  const room = useContext(RoomContext);
  if (!room) throw new Error("useRoom must be used within <FormRoom>");
  return room;
}

export function useRoomState(key, initial) {
  const { store, setStoreValue } = useRoom();
  const value = Object.prototype.hasOwnProperty.call(store, key) ? store[key] : initial;
  const setValue = useCallback((next) => setStoreValue(key, next, initial), [setStoreValue, key, initial]);
  return [value, setValue];
}

export function useRoomKeys(handler) {
  const { modeKeysRef } = useRoom();

  useEffect(() => {
    modeKeysRef.current = handler;
  });

  useEffect(() => () => { modeKeysRef.current = null; }, [modeKeysRef]);
}
