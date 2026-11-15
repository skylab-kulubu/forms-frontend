"use client";

import { useEffect } from "react";
import { exposeToTour } from "./frame";

export default function TourHandle({ name, value }) {
  useEffect(() => exposeToTour(name, value));
  return null;
}
