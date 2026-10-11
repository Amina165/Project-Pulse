import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

const page = (name) => fileURLToPath(new URL(`./${name}.html`, import.meta.url));

// Every page is its own entry so `npm run build` includes all of them.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: page("index"),
        login: page("login"),
        donate: page("donate"),
        donors: page("donors"),
        admin: page("admin"),
        history: page("history"),
        profile: page("profile"),
        urgent: page("urgent"),
      },
    },
  },
});
