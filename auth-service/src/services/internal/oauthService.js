import {
  getUserRepository,
  getOAuthAccountRepository,
} from '../../repositories/repositoryFactory.js';
import { generateTokens } from '../../utils/tokenUtils.js';
import { sanitizeUserForResponse } from '../../utils/sanitizers.js';
import { v4 as uuidv4 } from 'uuid';

// Get repository instances from factory
const userRepository = getUserRepository();
const oauthAccountRepository = getOAuthAccountRepository();

// ========== OAUTH LOGIN ==========

/**
 * OAuth login with provider
 */
export async function oauthLogin(provider, oauthData) {
  try {
    const {
      access_token,
      provider_user_id,
      email,
      first_name,
      last_name,
      picture,
      refresh_token,
      expires_at,
    } = oauthData;

    // Check if OAuth account exists
    let oauthAccount = await oauthAccountRepository.findByProviderAndUserId(
      provider,
      provider_user_id
    );
    let user = null;

    if (oauthAccount) {
      // Existing OAuth user - get user data
      user = await userRepository.findById(oauthAccount.user_id);
      if (!user || user.status !== 'active') {
        throw new Error('User account is inactive or deleted');
      }

      // Update OAuth account tokens
      await oauthAccountRepository.update(oauthAccount.id, {
        access_token,
        refresh_token,
        expires_at: expires_at ? new Date(expires_at * 1000) : null,
        updated_at: new Date(),
      });
    } else {
      // New OAuth user - check if email exists
      user = await userRepository.findByEmail(email);

      if (user) {
        // Email exists but no OAuth account - link OAuth to existing account
        oauthAccount = await oauthAccountRepository.create({
          user_id: user.id,
          provider,
          provider_user_id,
          access_token,
          refresh_token,
          expires_at: expires_at ? new Date(expires_at * 1000) : null,
        });

        // Update user auth type
        await userRepository.updateUser(user.id, {
          auth_type: 'oauth',
          updated_at: new Date(),
        });
      } else {
        // Create new user with OAuth
        user = await userRepository.createUser({
          email,
          first_name,
          last_name,
          profile_picture_url: picture,
          auth_type: 'oauth',
          status: 'active',
          is_verified: true, // OAuth users are pre-verified
          email_verified_at: new Date(),
        });

        // Create OAuth account
        oauthAccount = await oauthAccountRepository.create({
          user_id: user.id,
          provider,
          provider_user_id,
          access_token,
          refresh_token,
          expires_at: expires_at ? new Date(expires_at * 1000) : null,
        });
      }
    }

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await generateTokens(user.id, {
      email: user.email,
      role: user.role,
    });

    // Create session
    await userRepository.createUserSession(user.id, {
      session_id: uuidv4(),
      refresh_token: tokens.refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: sanitizeUserForResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  } catch (error) {
    throw new Error(`OAuth login failed: ${error.message}`);
  }
}

/**
 * Link OAuth account to existing user
 */
export async function linkOAuthAccount(userId, provider, oauthData) {
  try {
    const { access_token, provider_user_id, refresh_token, expires_at } = oauthData;

    // Check if OAuth account already exists
    const existingAccount = await oauthAccountRepository.findByProviderAndUserId(
      provider,
      provider_user_id
    );
    if (existingAccount) {
      throw new Error('OAuth account already linked to another user');
    }

    // Create OAuth account
    const oauthAccount = await oauthAccountRepository.create({
      user_id: userId,
      provider,
      provider_user_id,
      access_token,
      refresh_token,
      expires_at: expires_at ? new Date(expires_at * 1000) : null,
    });

    // Update user auth type
    await userRepository.updateUser(userId, {
      auth_type: 'oauth',
      updated_at: new Date(),
    });

    return oauthAccount;
  } catch (error) {
    throw new Error(`Failed to link OAuth account: ${error.message}`);
  }
}

/**
 * Unlink OAuth account
 */
export async function unlinkOAuthAccount(userId, provider) {
  try {
    const oauthAccount = await oauthAccountRepository.findByUserAndProvider(userId, provider);
    if (!oauthAccount) {
      throw new Error('OAuth account not found');
    }

    await oauthAccountRepository.deleteOAuthAccount(oauthAccount.id);

    // Check if user has other OAuth accounts
    const remainingAccounts = await oauthAccountRepository.findByUserId(userId);
    if (remainingAccounts.length === 0) {
      // No more OAuth accounts - update auth type
      await userRepository.updateUser(userId, {
        auth_type: 'email',
        updated_at: new Date(),
      });
    }

    return { message: 'OAuth account unlinked successfully' };
  } catch (error) {
    throw new Error(`Failed to unlink OAuth account: ${error.message}`);
  }
}

/**
 * Get user's OAuth accounts
 */
export async function getUserOAuthAccounts(userId) {
  try {
    const accounts = await oauthAccountRepository.findByUserId(userId);
    return accounts.map((account) => ({
      id: account.id,
      provider: account.provider,
      provider_user_id: account.provider_user_id,
      created_at: account.created_at,
    }));
  } catch (error) {
    throw new Error(`Failed to get OAuth accounts: ${error.message}`);
  }
}

// ========== OAUTH TOKEN VERIFICATION ==========

/**
 * Verify OAuth token and get user info from provider
 */
export async function verifyOAuthToken(provider, token) {
  try {
    switch (provider.toLowerCase()) {
      case 'google':
        return await verifyGoogleToken(token);
      case 'facebook':
        return await verifyFacebookToken(token);
      case 'github':
        return await verifyGithubToken(token);
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  } catch (error) {
    throw new Error(`OAuth token verification failed: ${error.message}`);
  }
}

/**
 * Verify Google OAuth token
 */
async function verifyGoogleToken(token) {
  try {
    // In a real implementation, you would call Google's API
    // For now, we'll simulate the verification
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`
    );

    if (!response.ok) {
      throw new Error('Invalid Google token');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }

    const userInfo = await userInfoResponse.json();

    return {
      provider_user_id: userInfo.id,
      email: userInfo.email,
      first_name: userInfo.given_name || '',
      last_name: userInfo.family_name || '',
      picture: userInfo.picture,
      verified_email: userInfo.verified_email,
    };
  } catch (error) {
    throw new Error(`Google token verification failed: ${error.message}`);
  }
}

/**
 * Verify Facebook OAuth token
 */
async function verifyFacebookToken(token) {
  try {
    // In a real implementation, you would call Facebook's API
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture&access_token=${token}`
    );

    if (!response.ok) {
      throw new Error('Invalid Facebook token');
    }

    const userInfo = await response.json();

    return {
      provider_user_id: userInfo.id,
      email: userInfo.email,
      first_name: userInfo.first_name || '',
      last_name: userInfo.last_name || '',
      picture: userInfo.picture?.data?.url,
      verified_email: true, // Facebook emails are generally verified
    };
  } catch (error) {
    throw new Error(`Facebook token verification failed: ${error.message}`);
  }
}

/**
 * Verify GitHub OAuth token
 */
async function verifyGithubToken(token) {
  try {
    // In a real implementation, you would call GitHub's API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Invalid GitHub token');
    }

    const userInfo = await response.json();

    // Get user email from GitHub
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    let email = '';
    if (emailResponse.ok) {
      const emails = await emailResponse.json();
      const primaryEmail = emails.find((e) => e.primary);
      email = primaryEmail ? primaryEmail.email : emails[0]?.email || '';
    }

    return {
      provider_user_id: userInfo.id.toString(),
      email: email,
      first_name: userInfo.name?.split(' ')[0] || '',
      last_name: userInfo.name?.split(' ').slice(1).join(' ') || '',
      picture: userInfo.avatar_url,
      verified_email: true, // GitHub emails are generally verified
    };
  } catch (error) {
    throw new Error(`GitHub token verification failed: ${error.message}`);
  }
}
