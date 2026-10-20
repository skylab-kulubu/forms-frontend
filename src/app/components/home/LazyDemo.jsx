"use client";

import dynamic from "next/dynamic";
import Deferred from "./Deferred";

const Placeholder = () => <div className="hm-demo-ph" aria-hidden="true" />;

const DEMOS = {
  after: dynamic(() => import("./applicants/AfterApply"), { ssr: false, loading: Placeholder }),
  review: dynamic(() => import("./communities/ReviewLoop"), { ssr: false, loading: Placeholder }),
  flow: dynamic(() => import("./communities/FlowDemo"), { ssr: false, loading: Placeholder }),
  editor: dynamic(() => import("./communities/EditorDemo"), { ssr: false, loading: Placeholder }),
};

export default function LazyDemo({ name, className = "" }) {
  const Demo = DEMOS[name];
  if (!Demo) return null;
  return (
    <Deferred className={`hm-demo hm-demo-${name} ${className}`.trim()} placeholder={<Placeholder />}>
      <Demo />
    </Deferred>
  );
}
