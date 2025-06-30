import { getOrganizationRepository } from '../../repositories/repositoryFactory.js';
import {
  sanitizeOrganizationInput,
  sanitizeOrganizationForResponse,
} from '../../utils/sanitizers.js';

// Get organization repository instance from factory
const organizationRepository = getOrganizationRepository();

// ========== ORGANIZATION REGISTRATION ==========

/**
 * Create organization during user registration
 */
export async function createOrganizationForUser(userId, organizationData) {
  try {
    if (!organizationData || !organizationData.name) {
      throw new Error('Organization name is required');
    }

    const sanitizedData = sanitizeOrganizationInput(organizationData);

    // Check if user already has an organization
    const existingOrg = await organizationRepository.findByUserId(userId);
    if (existingOrg) {
      throw new Error('User already has an organization');
    }

    const newOrganization = await organizationRepository.create({
      ...sanitizedData,
      user_id: userId,
      is_verified: false, // Default to unverified
    });

    return sanitizeOrganizationForResponse(newOrganization);
  } catch (error) {
    throw new Error(`Failed to create organization: ${error.message}`);
  }
}

// ========== ORGANIZATION MANAGEMENT ==========

/**
 * Get organization by ID
 */
export async function getOrganization(organizationId) {
  try {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    return sanitizeOrganizationForResponse(organization);
  } catch (error) {
    throw new Error(`Failed to get organization: ${error.message}`);
  }
}

/**
 * Get organization by user ID
 */
export async function getOrganizationByUserId(userId) {
  try {
    const organization = await organizationRepository.findByUserId(userId);
    if (!organization) {
      return null; // User might not have organization
    }

    return sanitizeOrganizationForResponse(organization);
  } catch (error) {
    throw new Error(`Failed to get user organization: ${error.message}`);
  }
}

/**
 * Update organization
 */
export async function updateOrganization(organizationId, updateData) {
  try {
    const sanitizedData = sanitizeOrganizationInput(updateData);
    const updatedOrganization = await organizationRepository.update(organizationId, sanitizedData);

    return sanitizeOrganizationForResponse(updatedOrganization);
  } catch (error) {
    throw new Error(`Failed to update organization: ${error.message}`);
  }
}

/**
 * Delete organization
 */
export async function deleteOrganization(organizationId) {
  try {
    await organizationRepository.deleteOrganization(organizationId);
    return { message: 'Organization deleted successfully' };
  } catch (error) {
    throw new Error(`Failed to delete organization: ${error.message}`);
  }
}

// ========== ORGANIZATION LISTING & SEARCH ==========

/**
 * Get organizations list (with pagination)
 */
export async function getOrganizations(page = 1, pageSize = 20, filters = {}) {
  try {
    const conditions = {};

    if (filters.is_verified !== undefined) {
      conditions.is_verified = filters.is_verified;
    }

    const options = {
      orderBy: filters.orderBy || 'created_at',
      orderDirection: filters.orderDirection || 'desc',
    };

    return await organizationRepository.paginate(page, pageSize, conditions, options);
  } catch (error) {
    throw new Error(`Failed to get organizations list: ${error.message}`);
  }
}

/**
 * Search organizations
 */
export async function searchOrganizations(searchTerm, page = 1, pageSize = 20) {
  try {
    const offset = (page - 1) * pageSize;
    const organizations = await organizationRepository.searchOrganizations(searchTerm, {
      limit: pageSize,
      offset,
    });

    const total = await organizationRepository.count({
      search: searchTerm,
    });

    return {
      data: organizations.map((org) => sanitizeOrganizationForResponse(org)),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    throw new Error(`Search organizations failed: ${error.message}`);
  }
}

// ========== ORGANIZATION VERIFICATION ==========

/**
 * Verify organization (admin function)
 */
export async function verifyOrganization(organizationId) {
  try {
    const updatedOrganization = await organizationRepository.update(organizationId, {
      is_verified: true,
      verified_at: new Date(),
    });

    return sanitizeOrganizationForResponse(updatedOrganization);
  } catch (error) {
    throw new Error(`Failed to verify organization: ${error.message}`);
  }
}

/**
 * Unverify organization (admin function)
 */
export async function unverifyOrganization(organizationId) {
  try {
    const updatedOrganization = await organizationRepository.update(organizationId, {
      is_verified: false,
      verified_at: null,
    });

    return sanitizeOrganizationForResponse(updatedOrganization);
  } catch (error) {
    throw new Error(`Failed to unverify organization: ${error.message}`);
  }
}
