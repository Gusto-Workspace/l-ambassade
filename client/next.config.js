const { i18n } = require("./next-i18next.config");

module.exports = {
  reactStrictMode: false,
  pageExtensions: ["api.js", "page.js"],
  i18n,
  async headers() {
    return [
      {
        source: "/menus",
        has: [{ type: "query", key: "gustoPrint", value: "1" }],
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors https://www.gusto-manager.com;",
          },
        ],
      },
    ];
  },
};
