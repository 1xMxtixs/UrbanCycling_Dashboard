import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function runTest(url, label) {
  console.log(`\n--- Running test: ${label} with URL: ${url} ---`);
  try {
    const adapter = new PrismaMariaDb(url);
    const prisma = new PrismaClient({ adapter });
    await prisma.$connect();
    console.log(`Success connecting with ${label}!`);
    const count = await prisma.producto.count();
    console.log(`Count: ${count}`);
    await prisma.$disconnect();
  } catch (e) {
    console.error(`Error with ${label}:`, e.message);
  }
}

async function main() {
  // Test 1: local URL from env
  await runTest(process.env.DATABASE_URL, "Local Env URL");

  // Test 2: URL with mysql://
  await runTest("mysql://root:root_cycling_pass@localhost:3306/urbancycling_db", "Explicit mysql:// URL");

  // Test 3: URL with mariadb://
  await runTest("mariadb://root:root_cycling_pass@localhost:3306/urbancycling_db", "Explicit mariadb:// URL");
  
  // Test 4: empty string
  await runTest("", "Empty String URL");

  // Test 5: undefined
  await runTest(undefined, "Undefined URL");
}

main();
