"use client";

import { useRef } from "react";
import MainHeader from "./Headers";
import Background from "./Background";
import Footer from "./Footer";
import Hero from "./landing/Hero";
import Features from "./landing/Features";
import Flow from "./landing/Flow";
import { ScrollContainerContext, Spotlight, useReveal } from "./landing/utils";

export default function Landing() {
  const scrollRef = useRef(null);
  useReveal(scrollRef);

  return (
    <ScrollContainerContext.Provider value={scrollRef}>
      <main ref={scrollRef} className="sl-root relative h-dvh overflow-y-auto overflow-x-hidden scroll-smooth scrollbar [scrollbar-gutter:stable_both-edges] bg-neutral-950 text-white selection:bg-skylab-500 selection:text-neutral-900 font-sans">
        <Background />
        <Spotlight />

        <div className="relative z-10">
          <MainHeader />
          <Hero />
          <Features />
          <Flow />
          <Footer />
        </div>
      </main>
    </ScrollContainerContext.Provider>
  );
}