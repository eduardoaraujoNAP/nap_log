const productionRequired = [
  'DATABASE_URL',
  'OIDC_ISSUER',
  'OIDC_AUDIENCE',
  'S3_ENDPOINT',
  'S3_BUCKET',
  'S3_ACCESS_KEY',
  'S3_SECRET_KEY',
  'INTERNAL_SERVICE_KEY',
  'PUBLIC_PROOF_BASE_URL',
] as const;

export function validateConfiguration(input: Record<string, unknown>): Record<string, unknown> {
  if (input.NODE_ENV !== 'production') return input;
  if (input.DEV_AUTH_BYPASS === 'true') throw new Error('DEV_AUTH_BYPASS cannot be enabled in production');
  const missing = productionRequired.filter(name => typeof input[name] !== 'string' || !(input[name] as string).trim());
  if (missing.length) throw new Error(`Missing production configuration: ${missing.join(', ')}`);
  for (const name of ['S3_SECRET_KEY', 'INTERNAL_SERVICE_KEY'] as const) {
    const value = String(input[name]);
    if (value.length < 24 || /change-me|nap-log-dev/i.test(value)) throw new Error(`${name} must be a strong production secret`);
  }
  const proofUrl = new URL(String(input.PUBLIC_PROOF_BASE_URL));
  if (proofUrl.protocol !== 'https:') throw new Error('PUBLIC_PROOF_BASE_URL must use HTTPS in production');
  return input;
}
