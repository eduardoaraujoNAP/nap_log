import { validateConfiguration } from "../src/configuration";

const production = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://db",
  OIDC_ISSUER: "https://auth.example.test",
  OIDC_AUDIENCE: "nap-log-api",
  S3_ENDPOINT: "http://minio:9000",
  S3_PUBLIC_ENDPOINT: "https://objects.example.test",
  S3_BUCKET: "proofs",
  S3_ACCESS_KEY: "access-key",
  S3_SECRET_KEY: "a-strong-storage-secret-with-32-chars",
  INTERNAL_SERVICE_KEY: "a-strong-service-secret-with-32-chars",
  PUBLIC_PROOF_BASE_URL: "https://api.example.test/v1/public/proofs",
};

describe("production configuration", () => {
  it("requires a public HTTPS storage endpoint", () => {
    expect(validateConfiguration(production)).toBe(production);
    expect(() =>
      validateConfiguration({
        ...production,
        S3_PUBLIC_ENDPOINT: "http://objects.example.test",
      }),
    ).toThrow("S3_PUBLIC_ENDPOINT must use HTTPS");
  });
});
