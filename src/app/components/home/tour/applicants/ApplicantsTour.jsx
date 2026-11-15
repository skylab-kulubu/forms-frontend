"use client";

import { SECTIONS } from "../../config";
import Tour from "../Tour";
import { INTRO } from "./intro";
import "./mail.css";

const IDS = SECTIONS.kisiler;
const DEEP = { [IDS.after]: "form" };
const film = () => import("./film");

export default function ApplicantsTour() {
  return <Tour film={film} sections={IDS} deep={DEEP} intro={INTRO} column />;
}
