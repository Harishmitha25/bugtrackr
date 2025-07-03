module.exports = {
  mode: "jit",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#102B4E",
        secondary: "#1F4A7C",
        accent: "#F4A261",
        success: "#2E7D32",
        error: "#D32F2F",
        warning: "#E09F3E",
        info: "#0288D1",
        background: "#F8F9FB",
        card: "#FFFFFF",
        border: "#D3D6DB",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
