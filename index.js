
```javascript
const Anthropic = require("@anthropic-ai/sdk");
const crypto = require("crypto");
const readline = require("readline");

const client = new Anthropic();

// Function to calculate password entropy
function calculateEntropy(password) {
  const charsetSizes = {
    lowercase: 26,
    uppercase: 26,
    digits: 10,
    symbols: 32,
  };

  let totalCharset = 0;
  if (/[a-z]/.test(password)) totalCharset += charsetSizes.lowercase;
  if (/[A-Z]/.test(password)) totalCharset += charsetSizes.uppercase;
  if (/[0-9]/.test(password)) totalCharset += charsetSizes.digits;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    totalCharset += charsetSizes.symbols;
  }

  const entropy = password.length * Math.log2(totalCharset);
  return {
    entropy: entropy,
    bits: entropy.toFixed(2),
    charset: totalCharset,
    strength:
      entropy < 30
        ? "Muy débil"
        : entropy < 50
          ? "Débil"
          : entropy < 70
            ? "Bueno"
            : entropy < 100
              ? "Fuerte"
              : "Muy fuerte",
  };
}

// Function to generate a secure random password
function generateRandomPassword(length = 16, includeSymbols = true) {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}';:\"\\|,.<>/?";

  let charset = lowercase + uppercase + digits;
  if (includeSymbols) charset += symbols;

  let password = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

// Function to validate password requirements
function validatePassword(password) {
  const requirements = {
    length: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigits: /[0-9]/.test(password),
    hasSymbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const passed = Object.values(requirements).filter((v) => v).length;
  const total = Object.keys(requirements).length;

  return {
    requirements,
    passed,
    total,
    isValid: passed >= 4,
  };
}

// Main interactive function with Claude
async function main() {
  console.log("🔐 Generador de Contraseñas Seguras con Análisis de Entropía");
  console.log("=".repeat(60));
  console.log(
    "\nUtilizando Claude como asistente para análisis y recomendaciones\n"
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  let continueSession = true;

  while (continueSession) {
    console.log("\nOpciones:");
    console.log("1. Generar contraseña segura aleatoria");
    console.log("2. Analizar contraseña existente");
    console.log("3. Obtener recomendaciones de Claude");
    console.log("4. Salir");

    const choice = await question("\nSelecciona una opción (1-4): ");

    if (choice === "1") {
      console.log("\n--- Generador de Contraseña Aleatoria ---");
      const lengthStr = await question(
        "¿Cuántos caracteres? (default: 16): "
      );
      const length = parseInt(lengthStr) || 16;
      const includeSymbols =
        (await question("¿Incluir símbolos especiales? (s/n): ")) === "s";

      if (length < 8) {
        console.log("❌ La longitud mínima es 8 caracteres");
        continue;
      }

      const password = generateRandomPassword(length, includeSymbols);
      const entropy = calculateEntropy(password);
      const validation = validatePassword(password);

      console.log(`\n✅ Contraseña generada: ${password}`);
      console.log(`📊 Entropía: ${entropy.bits} bits`);
      console.log(`💪 Fortaleza: ${entropy.strength}`);
      console.log(`✓ Requisitos cumplidos: ${validation.passed}/${validation.total}`);

      // Ask Claude for security assessment
      const claudePrompt = `Analiza esta contraseña desde el punto de vista de seguridad cibernética:
Contraseña: ${password}
Entropía: ${entropy.bits} bits
Fortaleza: ${entropy.strength}
Requisitos cumplidos: ${validation.passed}/${validation.total}

Proporciona un análisis breve de su seguridad y si es adecuada para uso general.`;

      try {
        const message = await client.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: claudePrompt