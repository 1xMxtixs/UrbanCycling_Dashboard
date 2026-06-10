import bcrypt from "bcryptjs";

const hash1 = "$2a$12$R9h/lS7wMw4v.4yXW1zOPOeO72/MshVvUu0wGZ8lqYThLzD7E2yC6";
const hash2 = "$2b$12$.7swDycyqmKg6ImOt/GmFuT20Ty0SY/wk7TFv9vujcRXpOVZs3snO";

const passwords = [
  "Admin1234",
  "admin1234",
  "Admin123",
  "admin123",
  "123456",
  "admin",
  "QA",
  "QA1234",
  "QAAdmin",
  "QA.Admin",
  "QAAdmin1234",
  "qa.admin2",
  "qa.admin2@urbancycling.cl",
  "22.222.222-2",
  "22222222-2",
  "222222222",
  "activo",
  "QA Admin Prueba",
  "QA Admin",
  "QAAdminPrueba",
  "urban",
  "cycling",
  "urbancycling",
  "UrbanCycling",
  "AdminUrbanCycling",
  "admin@urbancycling.cl",
  "11.111.111-1",
  "11111111-1",
  "111111111",
  "Admin1234!",
  "Admin12345",
  "Admin123456",
  "Admin.1234",
  "Admin-1234"
];

async function check() {
  console.log("Checking hash 1:");
  for (const pw of passwords) {
    try {
      const match = await bcrypt.compare(pw, hash1);
      if (match) console.log(`  MATCH: ${pw}`);
    } catch(e) {}
  }

  console.log("Checking hash 2:");
  for (const pw of passwords) {
    try {
      const match = await bcrypt.compare(pw, hash2);
      if (match) console.log(`  MATCH: ${pw}`);
    } catch(e) {}
  }
  console.log("Done checking.");
}

check();
