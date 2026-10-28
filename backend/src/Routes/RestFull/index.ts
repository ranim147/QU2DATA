import { readdirSync } from "fs";
import * as path from "path";
import { Router } from "express";
import * as fs from "fs";

const configPath = path.join(__dirname, "../../", "Config", "config.json");
let config;

try {
  const configData = fs.readFileSync(configPath, "utf-8");
  config = JSON.parse(configData);
} catch (error) {
  console.error("Error reading config.json:", error);
  process.exit(1);
}
const { env, backendRouter } = config;
if (env === "dev") {
  console.info("Logging Rest APIs ");
}

const restFullRouter = Router();

const scriptDirectory = __dirname;
const registerRoutes = (router: Router, dir: string) => {
  const files = readdirSync(dir, { withFileTypes: true });

  files.forEach((file) => {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // Recursively register routes from subdirectories
      registerRoutes(router, filePath);
    } else if (file.name === "rest.api.ts" || file.name === "rest.api.js") {
      try {
        const route = require(filePath);
        if (route.router) {
          route.router.stack.forEach((layer: any) => {
            const routePath = `${backendRouter}/api/Rest/v1/${path.basename(
              dir
            )}${layer.route.path}`;
            const routerMethod = layer.route.stack[0].method;

            router.use(`/${path.basename(dir)}`, route.router);
            if (env === "dev") {
              console.log(
                ` Link ::::: ${routePath} :: Method : ${routerMethod.toUpperCase()}`
              );
            }
          });
        }
      } catch (error) {
        console.error({ error });
      }
    }
  });
};

registerRoutes(restFullRouter, scriptDirectory);

export { restFullRouter };
