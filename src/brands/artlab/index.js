import "./artlab.css";
import { artlabDisplay, artlabSans } from "./fonts";
import { Backdrop, CardTop } from "./slots";

const artlab = {
  scopeClass: `${artlabSans.variable} ${artlabDisplay.variable}`,
  fontLoads: [
    `700 26px ${artlabDisplay.style.fontFamily}`,
    `400 16px ${artlabSans.style.fontFamily}`,
    `600 16px ${artlabSans.style.fontFamily}`,
  ],
  slots: { Backdrop, CardTop },
};

export default artlab;
