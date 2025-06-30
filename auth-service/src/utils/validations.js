/**
 * Validation utility functions for authentication
 */

/**
 * Validate email format
 */
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    errors: {
      length:
        password.length < minLength ? `Password must be at least ${minLength} characters` : null,
      uppercase: !hasUpperCase ? 'Password must contain at least 1 uppercase letter' : null,
      lowercase: !hasLowerCase ? 'Password must contain at least 1 lowercase letter' : null,
      numbers: !hasNumbers ? 'Password must contain at least 1 number' : null,
      specialChar: !hasSpecialChar ? 'Password must contain at least 1 special character' : null,
    },
  };
}

/**
 * Validate username format
 */
export function validateUsername(username) {
  const minLength = 3;
  const maxLength = 30;
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;

  if (!username || username.length < minLength) {
    return {
      isValid: false,
      error: `Username must be at least ${minLength} characters`,
    };
  }

  if (username.length > maxLength) {
    return {
      isValid: false,
      error: `Username must be no more than ${maxLength} characters`,
    };
  }

  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      error: 'Username can only contain letters, numbers, underscores and hyphens',
    };
  }

  return { isValid: true };
}

/**
 * Validate phone number format
 */
export function validatePhone(phone) {
  if (!phone) return { isValid: true }; // Phone is optional

  const phoneRegex = /^\+?[\d\s\-\(\)]{10,15}$/;
  return {
    isValid: phoneRegex.test(phone),
    error: phoneRegex.test(phone) ? null : 'Invalid phone number format',
  };
}

/**
 * Validate user registration data
 */
export function validateRegistration(data) {
  const errors = [];

  if (!data.email) {
    errors.push('Email is required');
  } else if (!validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.password) {
    errors.push('Password is required');
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      Object.values(passwordValidation.errors).forEach((error) => {
        if (error) errors.push(error);
      });
    }
  }

  if (data.username) {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.isValid) {
      errors.push(usernameValidation.error);
    }
  }

  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate user profile update data
 */
export function validateProfileUpdate(data) {
  const errors = [];

  if (data.email && !validateEmail(data.email)) {
    errors.push('Invalid email format');
  }

  if (data.username) {
    const usernameValidation = validateUsername(data.username);
    if (!usernameValidation.isValid) {
      errors.push(usernameValidation.error);
    }
  }

  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate password change data
 */
export function validatePasswordChange(currentPassword, newPassword) {
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required');
  }

  if (!newPassword) {
    errors.push('New password is required');
  } else {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      Object.values(passwordValidation.errors).forEach((error) => {
        if (error) errors.push(error);
      });
    }
  }

  if (currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
