const QR = {
  "ekip-basvurusu-2026": { n: 29, b: "/pU7/BUgEG6cRrt196XbpzWuwTZJB/qqr+AXLQC3VHpcpLD0a4MBzCJxYx3uvQZqLbkeHzPs/y9GAv56vNLGXWupu+NIAQ3DRaZ//gBkBH/6imtQX8EZulHPpdZvrm64C0sEiBqv7UqVAA==" },
  "hackathon-2026": { n: 29, b: "/u9D/Bf4kG67jLt01pXbqlMuwSc1B/qqr+AKRQCft8S9YFOFtbKA6dK2oJF4YbDE9DH+u21+vhbVxQOZKEajQeW0lbeT03swz/lO/wBCRGP79OsQV68SusU/xdWYIK6D6m8Et0bf69rcAA==" },
  "yz-okuma-grubu": { n: 29, b: "/q9D/Bb4kG6xgLt0RrXbq1MuwSclB/qqr+ANQACf18S+zRGFkc6Y6Jo2kJKw4rCuLDX+SsxetbDTxSP5EEfjQ+W916WTyyswz7PM/wByTGP7NusQWY8Sus0fxdRcIK6cYm8E4wbf7PDcAA==" },
  "skysis-secmeler": { n: 29, b: "/nyT/BN4UG6NMLt0bgXboe4uwXsZB/qqr+ALTgCW4Q0H5Nt6WMg9vAIGf2G3DWXQEK4CvAcr8iPcOscHTRGBiBpjhTjGI2nvODGg+gBiRF/5eipQVrUeujrPjdVS366ENzsEW/kv7hWJAA==" },
  "forms-deneme": { n: 29, b: "/rnz/BZbEG6dyLt1UZXbpMUuwSEdB/qqr+AcyAC3DuJb6s30SI7bzBK+QxY8DIZmggkczOns/yCnAt5oPNItIGulvgFIeOPjRPbX/gBjtH/6k+tQURUbultPrdRWrq6260sEGRqv7/SVAA==" },
  "tanisma-ekim": { n: 29, b: "/m8j/BSIUG6qpLt1BoXbo3OuwQdVB/qqr+AfgACCk3Z1T9OFvZAAoREnNobk4LDevx3NK143lDrRxULrQWUFh/3wqa+TawcQCWWM+4BOfGP4PuuQQYMSuk2fxdOn466ehv0Esgbf78JOAA==" },
  "weblab-frontend": { n: 29, b: "/mnj/BZ3UG69SLt1MdXboR+uwTyBB/qqr+AQcQCC6NZ2hGWFi5HwoXq4Zo6/WbDmkE3PGsG3jZskxUOIQWdDc/3xsmWTGOkwCuQ0+4BlvGP4ZWuQQHcQuh6f3dG8426MZv0EtEbf7fROAA==" },
  "mobil-atolye": { n: 29, b: "/o8r/BW40G6rhrt0prXbqlcuwSM1B/qqr+ALQwCfv8S65RCFhISS6dIG4JIgYbC4dDH8TI1+tS7Sxf4JGEStAeWyz7WT8ftgz+ZE/wB6ZGP7t+sQU5sTup2fxdW1IK6cIm8Emgbf7sbcAA==" },
};

const cache = new Map();

function decode(q) {
  const n = q.n;
  const bits = typeof atob === "function" ? atob(q.b) : Buffer.from(q.b, "base64").toString("binary");
  const dark = (r, c) => {
    const i = r * n + c;
    return (bits.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1;
  };
  let d = "";
  for (let r = 0; r < n; r++) {
    let c = 0;
    while (c < n) {
      if (dark(r, c)) {
        let w = 1;
        while (c + w < n && dark(r, c + w)) w++;
        d += `M${c} ${r}h${w}v1h-${w}z`;
        c += w;
      } else c++;
    }
  }
  return { d, size: n };
}

export function posterQr(alias) {
  if (cache.has(alias)) return cache.get(alias);
  const q = QR[alias];
  if (!q) return null;
  const out = decode(q);
  cache.set(alias, out);
  return out;
}
