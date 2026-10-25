// 產生 docs/assets/sample/{free,paid,vip}.json：cd tests && npm run build-sample
import { writeFileSync, mkdirSync } from "node:fs";
import { buildSample } from "./sample.mjs";

const dir = new URL("../docs/assets/sample/", import.meta.url);
mkdirSync(dir, { recursive: true });
for (const tier of ["free", "paid", "vip"]) {
  const json = JSON.stringify(buildSample(tier));
  writeFileSync(new URL(`${tier}.json`, dir), json + "\n");
  console.log(`${tier}.json ${(json.length / 1024).toFixed(0)} KB`);
}
