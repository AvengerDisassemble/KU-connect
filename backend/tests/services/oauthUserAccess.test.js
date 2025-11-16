/**
 * @fileoverview Tests to verify OAuth users can access protected routes
 * This test ensures OAuth users have proper role and status set
 */

const { findOrCreateGoogleUser } = require('../../src/services/authService');
const prisma = require('../../src/models/prisma');

describe('OAuth User Access', () => {
  let testUserId;

  afterEach(async () => {
    // Cleanup test data
    if (testUserId) {
      await prisma.account.deleteMany({ where: { userId: testUserId } });
      await prisma.student.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
      testUserId = null;
    }
  });

  test('should create OAuth user with APPROVED status', async () => {
    const googleProfile = {
      providerAccountId: 'google-test-123',
      email: 'oauth.test@ku.th',
      name: 'OAuth',
      surname: 'Tester',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    const user = await findOrCreateGoogleUser(googleProfile);
    testUserId = user.id;

    // Verify user has correct fields
    expect(user).toBeDefined();
    expect(user.email).toBe('oauth.test@ku.th');
    expect(user.role).toBe('STUDENT');
    expect(user.verified).toBe(true);
    expect(user.status).toBe('APPROVED'); // Critical: should be APPROVED, not PENDING

    // Verify in database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        role: true,
        status: true,
        verified: true,
        password: true,
      },
    });

    expect(dbUser.role).toBe('STUDENT');
    expect(dbUser.status).toBe('APPROVED');
    expect(dbUser.verified).toBe(true);
    expect(dbUser.password).toBeNull(); // OAuth users don't have passwords
  });

  test('should create student profile for OAuth user', async () => {
    const googleProfile = {
      providerAccountId: 'google-test-456',
      email: 'oauth.student@ku.th',
      name: 'Student',
      surname: 'OAuth',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    const user = await findOrCreateGoogleUser(googleProfile);
    testUserId = user.id;

    // Verify student profile exists
    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: { degreeType: true },
    });

    expect(student).toBeDefined();
    expect(student.userId).toBe(user.id);
    expect(student.degreeType).toBeDefined();
  });

  test('should return existing user on subsequent OAuth logins', async () => {
    const googleProfile = {
      providerAccountId: 'google-test-789',
      email: 'oauth.existing@ku.th',
      name: 'Existing',
      surname: 'User',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    // First login - creates user
    const user1 = await findOrCreateGoogleUser(googleProfile);
    testUserId = user1.id;

    expect(user1).toBeDefined();
    expect(user1.status).toBe('APPROVED');

    // Second login - returns same user
    const user2 = await findOrCreateGoogleUser(googleProfile);

    expect(user2.id).toBe(user1.id);
    expect(user2.email).toBe(user1.email);
    expect(user2.status).toBe('APPROVED');
    expect(user2.verified).toBe(true);
  });

  test('should link Google account to existing user with email', async () => {
    // Create a regular user first
    const regularUser = await prisma.user.create({
      data: {
        name: 'Regular',
        surname: 'User',
        email: 'regular.user@ku.th',
        password: 'hashed-password',
        role: 'STUDENT',
        status: 'PENDING', // Regular users start as PENDING
        verified: false,
      },
    });

    testUserId = regularUser.id;

    // Create student profile
    const degreeType = await prisma.degreeType.findFirst();
    await prisma.student.create({
      data: {
        userId: regularUser.id,
        degreeTypeId: degreeType.id,
        address: 'Test Address',
      },
    });

    // Now login with Google using same email
    const googleProfile = {
      providerAccountId: 'google-test-existing-email',
      email: 'regular.user@ku.th', // Same email as regular user
      name: 'Regular',
      surname: 'User',
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    const linkedUser = await findOrCreateGoogleUser(googleProfile);

    // Should return the same user (linked by email)
    expect(linkedUser.id).toBe(regularUser.id);
    expect(linkedUser.status).toBe('PENDING'); // Maintains original status
    expect(linkedUser.verified).toBe(false); // Maintains original verified status

    // Verify Google account was linked
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: 'google-test-existing-email',
        },
      },
    });

    expect(account).toBeDefined();
    expect(account.userId).toBe(regularUser.id);
  });
});
