// Gera src/adapters/saida/http/schema.d.ts a partir do openapi.json do backend.
// Ordem: argumento (caminho ou URL) > ../expresso-cafe-backend/openapi.json > GitHub (branch master).
// Uso: pnpm api:tipos  |  pnpm api:tipos http://localhost:3333/openapi.json
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const LOCAL = "../expresso-cafe-backend/openapi.json";
const GITHUB = "https://raw.githubusercontent.com/LucasHevandro/expresso-cafe-backend/master/openapi.json";
const origem = process.argv[2] ?? (existsSync(LOCAL) ? LOCAL : GITHUB);

console.log(`Gerando os tipos da API a partir de ${origem}`);
// Chama o CLI pelo próprio Node, sem shell (funciona igual no Windows e no Linux).
execFileSync(process.execPath, ["node_modules/openapi-typescript/bin/cli.js", origem, "-o", "src/adapters/saida/http/schema.d.ts"], { stdio: "inherit" });
