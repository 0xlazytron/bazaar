export interface ValidationError {
  field: string;
  message: string;
  icon: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validation rules
export const validateEmail = (email: string): ValidationError | null => {
  if (!email.trim()) {
    return {
      field: 'email',
      message: 'Email is required',
      icon: '📧'
    };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      field: 'email',
      message: 'Please enter a valid email address',
      icon: '⚠️'
    };
  }
  
  return null;
};

export const validatePassword = (password: string): ValidationError | null => {
  if (!password) {
    return {
      field: 'password',
      message: 'Password is required',
      icon: '🔒'
    };
  }
  
  if (password.length < 6) {
    return {
      field: 'password',
      message: 'Password must be at least 6 characters',
      icon: '🔑'
    };
  }
  
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationError | null => {
  if (!confirmPassword) {
    return {
      field: 'confirmPassword',
      message: 'Please confirm your password',
      icon: '🔒'
    };
  }
  
  if (password !== confirmPassword) {
    return {
      field: 'confirmPassword',
      message: 'Passwords do not match',
      icon: '❌'
    };
  }
  
  return null;
};

export const validateFullName = (fullName: string): ValidationError | null => {
  if (!fullName.trim()) {
    return {
      field: 'fullName',
      message: 'Full name is required',
      icon: '👤'
    };
  }
  
  if (fullName.trim().length < 2) {
    return {
      field: 'fullName',
      message: 'Name must be at least 2 characters',
      icon: '📝'
    };
  }
  
  return null;
};

// Form validation functions
export const validateSignInForm = (email: string, password: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSignUpForm = (
  fullName: string,
  email: string,
  password: string,
  confirmPassword: string
): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const nameError = validateFullName(fullName);
  if (nameError) errors.push(nameError);
  
  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);
  
  const passwordError = validatePassword(password);
  if (passwordError) errors.push(passwordError);
  
  const confirmPasswordError = validateConfirmPassword(password, confirmPassword);
  if (confirmPasswordError) errors.push(confirmPasswordError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateForgotPasswordForm = (email: string): ValidationResult => {
  const errors: ValidationError[] = [];
  
  const emailError = validateEmail(email);
  if (emailError) errors.push(emailError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};