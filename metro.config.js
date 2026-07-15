const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);
const nativeWindConfig = withNativeWind(config, { input: "./src/global.css" });

// ── Dev-only API proxy ──
// Forwards /api/* requests to the real backend server-side, so the
// browser sees a same-origin request (no CORS preflight at all).
// Only affects `expo start` web dev — production builds and native
// builds are untouched.
const originalEnhanceMiddleware = nativeWindConfig.server.enhanceMiddleware;
nativeWindConfig.server.enhanceMiddleware = (middleware, server) => {
  const withPrevious = originalEnhanceMiddleware
    ? originalEnhanceMiddleware(middleware, server)
    : middleware;

  return (req, res, next) => {
    if (req.url.startsWith("/api")) {
      return createProxyMiddleware({
        target: "https://backmovc.movementcreations.in",
        changeOrigin: true,
        secure: true,
      })(req, res, next);
    }
    return withPrevious(req, res, next);
  };
};

module.exports = nativeWindConfig;