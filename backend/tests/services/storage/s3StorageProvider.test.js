/**
 * @module tests/services/storage/s3StorageProvider.test
 * @description Test AWS S3 storage provider (requires AWS credentials in env)
 */

let S3StorageProvider;
let depsAvailable = true;

try {
  S3StorageProvider = require("../../../src/services/storage/s3StorageProvider");
} catch (error) {
  console.warn(
    "Skipping S3StorageProvider tests - dependencies not installed. Run: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner",
  );
  depsAvailable = false;
}

// Only run tests if S3 credentials are available AND dependencies are installed
const hasS3Config =
  depsAvailable &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_REGION &&
  process.env.AWS_BUCKET_NAME;

const describeIfS3 = hasS3Config && depsAvailable ? describe : describe.skip;

describeIfS3("S3StorageProvider (integration tests)", () => {
  let provider;

  beforeAll(() => {
    provider = new S3StorageProvider();
  });

  describe("constructor", () => {
    test("should create instance when env vars are present", () => {
      expect(provider).toBeInstanceOf(S3StorageProvider);
      expect(provider.bucketName).toBe(process.env.AWS_BUCKET_NAME);
    });

    test("should throw error when env vars are missing", () => {
      const originalEnv = { ...process.env };
      delete process.env.AWS_BUCKET_NAME;

      expect(() => new S3StorageProvider()).toThrow(
        "S3 provider missing required environment variables",
      );

      process.env = originalEnv;
    });
  });

  describe("uploadFile", () => {
    let uploadedKey;

    test("should upload file to S3 and return key", async () => {
      const buffer = Buffer.from("test S3 content");
      const fileKey = await provider.uploadFile(
        buffer,
        "test.txt",
        "text/plain",
        { prefix: "test-uploads" },
      );

      expect(fileKey).toMatch(/^test-uploads\/[a-f0-9-]+\.txt$/);
      uploadedKey = fileKey;
    }, 15000); // Increase timeout for S3 operations

    afterAll(async () => {
      // Clean up uploaded test file
      if (uploadedKey) {
        try {
          await provider.deleteFile(uploadedKey);
        } catch (error) {
          console.error("Failed to clean up test file:", error.message);
        }
      }
    });
  });

  describe("getFileUrl", () => {
    let testFileKey;

    beforeAll(async () => {
      // Upload a test file
      const buffer = Buffer.from("test content for URL");
      testFileKey = await provider.uploadFile(
        buffer,
        "url-test.txt",
        "text/plain",
        { prefix: "test-urls" },
      );
    }, 15000);

    afterAll(async () => {
      // Clean up
      if (testFileKey) {
        try {
          await provider.deleteFile(testFileKey);
        } catch (error) {
          console.error("Failed to clean up test file:", error.message);
        }
      }
    });

    test("should return signed URL", async () => {
      const url = await provider.getFileUrl(testFileKey);

      expect(url).toContain("https://");
      expect(url).toContain(process.env.AWS_BUCKET_NAME);
      expect(url).toContain(testFileKey);
      expect(url).toContain("X-Amz-Signature"); // Signed URL signature
    }, 10000);
  });

  describe("deleteFile", () => {
    test("should delete file from S3", async () => {
      // Upload a file to delete
      const buffer = Buffer.from("to be deleted");
      const fileKey = await provider.uploadFile(
        buffer,
        "delete-test.txt",
        "text/plain",
        { prefix: "test-deletes" },
      );

      // Delete it
      await expect(provider.deleteFile(fileKey)).resolves.not.toThrow();
    }, 15000);
  });
});

// Placeholder test when S3 config is missing
if (!hasS3Config) {
  describe("S3StorageProvider (skipped)", () => {
    test("S3 tests require AWS credentials in environment", () => {
      console.warn(
        "Skipping S3 tests - set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME to run",
      );
      expect(true).toBe(true);
    });
  });
}
