import daisyui from "daisyui";

module.exports = {
  content: [
    "./app/**/*.tsx",
    "../../packages/sdk-react-ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
};
