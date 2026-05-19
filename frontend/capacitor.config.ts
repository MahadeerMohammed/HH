import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.hotelhub.admin",
  appName: "HotelHub Admin",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "http"
  }
};

export default config;
