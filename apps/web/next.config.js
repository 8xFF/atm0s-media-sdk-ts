/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: [
    "@atm0s-media-sdk/sdk-core",
    "@atm0s-media-sdk/sdk-react-hooks",
    "@atm0s-media-sdk/sdk-react-ui",
  ],
  reactStrictMode: false,
};
