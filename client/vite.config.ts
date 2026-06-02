import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const reactPlugin = react as any;
const tailwindPlugin = tailwindcss as any;

const config: any = {
  fmt: {},
  lint: { options: { typeAware: true, typeCheck: true } },
  plugins: [reactPlugin(), tailwindPlugin()],
};

// https://vite.dev/config/
export default defineConfig(config);
