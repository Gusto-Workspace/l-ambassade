/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}"],
  theme: {
    colors: {
      extraWhite: "#FFFFFF",
      white: "#FFFFFF",
      black: "#070303",
      grey: "#3F3A36",
      lightGrey: "#EFF1F2",
      brown: "#56260F",
      darkBrown: "#22140C",
      khaki: "#554313",
      red: "#FF7664",
      blue: "#4583FF",
      green: "#4EAD7A",
      darkBlue: "#131E36",
      violet: "#634FD2",
    },
    screens: {
      ultraWild: "1400px",
      desktop: "1024px",
      tablet: "768px",
    },
    extend: {
      fontFamily: {
        DK_Crayonista: ['"DK Crayonista"', "cursive"],
      },
    },
  },
  plugins: [],
};
