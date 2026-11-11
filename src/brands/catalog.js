export const BRAND_CATALOG = {
  artlab: {
    name: "ARTLAB",
    siteUrl: "https://artlab.yildizskylab.com",
    siteLabel: "artlab.yildizskylab.com",
    icon: "/brands/artlab/icon.svg",
    themeColor: "#0b0e13",
  },
};

export const brandOptions = Object.entries(BRAND_CATALOG).map(([key, brand]) => ({ key, ...brand }));
