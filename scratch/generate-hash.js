import bcrypt from "bcryptjs";

async function run() {
  const hash = await bcrypt.hash("Admin1234", 12);
  console.log("HASH FOR Admin1234:", hash);
}

run();
