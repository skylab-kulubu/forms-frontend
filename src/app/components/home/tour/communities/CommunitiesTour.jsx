"use client";

import { SECTIONS } from "../../config";
import Tour from "../Tour";
import { INTRO } from "./intro";

const IDS = SECTIONS.topluluklar;
const DEEP = { [IDS.editor]: "build", [IDS.review]: "review", [IDS.flow]: "flow" };
const film = () => import("./film");

export default function CommunitiesTour() {
  return <Tour film={film} sections={IDS} deep={DEEP} intro={INTRO} slim tryable />;
}
