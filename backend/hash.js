import bcrypt from "bcrypt";

// Välj ett lösenord till ditt admin-konto
const password = "!Maximaxi11";

try {
  const hash = await bcrypt.hash(password, 10);
  console.log("Generated hash for password:", password);
  console.log(hash);
} catch (err) {
  console.error("Error generating hash:", err);
}
