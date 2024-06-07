import { readFileSync, writeFileSync } from "fs";

try {
    const pack = JSON.parse(readFileSync("package.json"));
    const system = JSON.parse(readFileSync("system.json"));
    system.version = pack.version;
    writeFileSync("system.json", JSON.stringify(system, null, 2));
} catch (error) {
    console.error(error);
}
