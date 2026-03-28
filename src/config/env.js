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

  if (!mongoUri) {
    errors.push("MONGO_URI is required");
  }

  if (!jwtSecret) {
    errors.push("JWT_SECRET is required");
  } else if (jwtSecret.length < 16 || PLACEHOLDER_SECRETS.has(jwtSecret.toLowerCase())) {
    errors.push("JWT_SECRET must be a strong secret (not placeholder and at least 16 chars)");
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join(", ")}`);
  }
}
