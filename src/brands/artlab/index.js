import "./artlab.css";
import { artlabDisplay, artlabSans } from "./fonts";
import { Backdrop, CardTop, Header } from "./slots";

const artlab = {
  scopeClass: `${artlabSans.variable} ${artlabDisplay.variable}`,
  slots: { Backdrop, Header, CardTop },
};

export default artlab;
