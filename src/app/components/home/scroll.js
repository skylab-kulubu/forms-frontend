"use client";

import { createContext, useContext } from "react";

export const ScrollContainerContext = createContext(null);
export const useScrollContainer = () => useContext(ScrollContainerContext);
