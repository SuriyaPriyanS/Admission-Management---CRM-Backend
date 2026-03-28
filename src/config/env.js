const PLACEHOLDER_SECRETS = new Set([
  "replace-with-a-strong-secret",
  "changeme",
  "secret",
  "jwt_secret",
]);

export function validateEnv() {
  const errors = [];
  const mongoUri = process.env.MONGO_URI;
  const jwtSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === "production";
  const isWeakSecret =
    Boolean(jwtSecret) && (jwtSecret.length < 16 || PLACEHOLDER_SECRETS.has(jwtSecret.toLowerCase()));

  if (!mongoUri) {
    errors.push("MONGO_URI is required");
  }

  if (!jwtSecret) {
    errors.push("JWT_SECRET is required");
  } else if (isProduction && isWeakSecret) {
    errors.push("JWT_SECRET must be a strong secret (not placeholder and at least 16 chars)");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join(", ")}`);
  }

  if (!isProduction && isWeakSecret) {
    // Local development warning only.
    console.warn("[env] Weak JWT_SECRET detected. Use a strong secret in production.");
  }
}
