/**
 * Input sanitization utility functions
 */

/**
 * Sanitize user input data
 */
export function sanitizeUserInput(input) {
  return {
    ...input,
    email: input.email?.toLowerCase().trim(),
    first_name: input.first_name?.trim(),
    last_name: input.last_name?.trim(),
    phone: input.phone?.trim(),
  };
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email) {
  return email?.toLowerCase().trim();
}

/**
 * Sanitize username
 */
export function sanitizeUsername(username) {
  return username?.toLowerCase().trim();
}

/**
 * Sanitize name fields
 */
export function sanitizeName(name) {
  return name?.trim();
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone) {
  return phone?.trim();
}

/**
 * Sanitize search term
 */
export function sanitizeSearchTerm(term) {
  return term?.trim().toLowerCase();
}

/**
 * Sanitize pagination parameters
 */
export function sanitizePagination(page, pageSize, maxPageSize = 100) {
  const sanitizedPage = Math.max(1, parseInt(page) || 1);
  const sanitizedPageSize = Math.min(maxPageSize, Math.max(1, parseInt(pageSize) || 20));

  return {
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    offset: (sanitizedPage - 1) * sanitizedPageSize,
  };
}

/**
 * Sanitize filter parameters
 */
export function sanitizeFilters(filters) {
  const sanitized = {};

  if (filters.status) {
    sanitized.status = filters.status.trim().toLowerCase();
  }

  if (filters.role) {
    sanitized.role = filters.role.trim().toLowerCase();
  }

  if (filters.orderBy) {
    sanitized.orderBy = filters.orderBy.trim().toLowerCase();
  }

  if (filters.orderDirection) {
    sanitized.orderDirection = filters.orderDirection.trim().toLowerCase();
  }

  return sanitized;
}

/**
 * Remove sensitive data from user object and map to protobuf structure
 */
export function sanitizeUserForResponse(user) {
  // eslint-disable-next-line no-unused-vars
  const { password_hash, internal_id, ...sanitizedUser } = user;

  // Map database fields to protobuf User structure
  return {
    id: sanitizedUser.public_id, // Map public_id to id for protobuf
    email: sanitizedUser.email,
    first_name: sanitizedUser.first_name,
    last_name: sanitizedUser.last_name,
    phone: sanitizedUser.phone,
    address: sanitizedUser.address,
    city: sanitizedUser.city,
    state: sanitizedUser.state,
    country: sanitizedUser.country,
    postal_code: sanitizedUser.postal_code,
    profile_picture_url: sanitizedUser.profile_picture_url,
    is_active: sanitizedUser.is_active,
    is_verified: sanitizedUser.is_verified,
    email_verified_at: sanitizedUser.email_verified_at
      ? new Date(sanitizedUser.email_verified_at).toISOString()
      : null,
    phone_verified_at: sanitizedUser.phone_verified_at
      ? new Date(sanitizedUser.phone_verified_at).toISOString()
      : null,
    last_login_at: sanitizedUser.last_login_at
      ? new Date(sanitizedUser.last_login_at).toISOString()
      : null,
    auth_type: sanitizedUser.auth_type,
    role: sanitizedUser.role,
    permissions: sanitizedUser.permissions || [],
  };
}

/**
 * Sanitize session data
 */
export function sanitizeSessionData(sessionData) {
  return {
    ip_address: sessionData.ip_address?.trim(),
    user_agent: sessionData.user_agent?.trim(),
  };
}

/**
 * Sanitize organization input data
 */
export function sanitizeOrganizationInput(input) {
  return {
    ...input,
    name: input.name?.trim(),
    description: input.description?.trim(),
    website: input.website?.trim(),
    phone: input.phone?.trim(),
    email: input.email?.toLowerCase().trim(),
    address: input.address?.trim(),
    city: input.city?.trim(),
    state: input.state?.trim(),
    country: input.country?.trim(),
    postal_code: input.postal_code?.trim(),
    tax_id: input.tax_id?.trim(),
    industry: input.industry?.trim(),
    size: input.size?.trim().toLowerCase(),
    status: input.status?.trim().toLowerCase(),
  };
}

/**
 * Sanitize organization for response (remove sensitive data and map to protobuf structure)
 */
export function sanitizeOrganizationForResponse(organization) {
  // eslint-disable-next-line no-unused-vars
  const { created_at, updated_at, deleted_at, internal_id, ...sanitizedOrganization } =
    organization;

  return {
    name: sanitizedOrganization.name,
    description: sanitizedOrganization.description,
    website_url: sanitizedOrganization.website_url,
    logo_url: sanitizedOrganization.logo_url,
    tax_id: sanitizedOrganization.tax_id,
    business_license: sanitizedOrganization.business_license,
    contact_person: sanitizedOrganization.contact_person,
    contact_phone: sanitizedOrganization.contact_phone,
    contact_email: sanitizedOrganization.contact_email,
    address: sanitizedOrganization.address,
    city: sanitizedOrganization.city,
    state: sanitizedOrganization.state,
    country: sanitizedOrganization.country,
    postal_code: sanitizedOrganization.postal_code,
  };
}
