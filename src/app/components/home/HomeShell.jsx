"use client";

import { useMemo, useRef, useState } from "react";
import Background from "../Background";
import { ScrollContainerContext } from "./scroll";
import { HomeContext } from "./HomeContext";
import { usePager } from "./usePager";
import { useReveal } from "./useReveal";
import { TourStoreContext, createTourStore } from "./tour/tourStore";
import HomeHeader from "./HomeHeader";
import HomeFooter from "./HomeFooter";
import PageRail from "./PageRail";
import "./shell.css";

export default function HomeShell({ page, block = "", children }) {
  const scrollRef = useRef(null);
  const trial = useRef(null);
  const [tour] = useState(createTourStore);
  const [headerSlot, setHeaderSlot] = useState(null);
  const pager = usePager(scrollRef, { selector: "[data-page]", block });
  const value = useMemo(() => ({ pager, trial, headerSlot }), [pager, headerSlot]);
  useReveal(scrollRef);

  return (
    <ScrollContainerContext.Provider value={scrollRef}>
      <HomeContext.Provider value={value}>
        <TourStoreContext.Provider value={tour}>
          <main ref={scrollRef} className="hm-main scrollbar">
            <Background />
            <HomeHeader page={page} slotRef={setHeaderSlot} />
            <PageRail containerRef={scrollRef} />
            <div className="hm-body">{children}</div>
            <HomeFooter page={page} />
          </main>
        </TourStoreContext.Provider>
      </HomeContext.Provider>
    </ScrollContainerContext.Provider>
  );
}
