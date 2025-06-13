import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AiOutlineEye,
  AiOutlineEyeInvisible,
  AiOutlineUser,
  AiOutlineMail,
} from 'react-icons/ai';
import Button from '@/components/ui/button';
import Form, { FormField, FormActions } from '@/components/ui/Form';
import Input from '@/components/ui/Input';
import useAuth from '@/hooks/useAuth';
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
} from '@/utils/validation';

interface FormState {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'candidate' | 'hr';
}

interface ValidationState {
  [key: string]: {
    isValid: boolean;
    isTouched: boolean;
    isValidating: boolean;
  };
}

const Register = () => {
  const [formData, setFormData] = useState<FormState>({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'candidate',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<ValidationState>({
    firstName: { isValid: false, isTouched: false, isValidating: false },
    lastName: { isValid: false, isTouched: false, isValidating: false },
    username: { isValid: false, isTouched: false, isValidating: false },
    email: { isValid: false, isTouched: false, isValidating: false },
    password: { isValid: false, isTouched: false, isValidating: false },
    confirmPassword: { isValid: false, isTouched: false, isValidating: false },
    role: { isValid: true, isTouched: true, isValidating: false },
  });

  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const timeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const validateField = (
    fieldName: string,
    value: string,
    currentFormData: FormState
  ) => {
    let validationResult;

    switch (fieldName) {
      case 'firstName':
      case 'lastName':
        validationResult = validateName(value);
        break;
      case 'username':
        validationResult = {
          isValid: /^[a-zA-Z0-9_]{3,20}$/.test(value),
          message:
            'Username must be 3-20 characters, letters, numbers, and underscores only',
        };
        break;
      case 'email':
        validationResult = validateEmail(value);
        break;
      case 'password':
        validationResult = validatePassword(value);
        break;
      case 'confirmPassword':
        validationResult = validatePasswordMatch(
          currentFormData.password,
          value
        );
        break;
      default:
        return;
    }

    setValidationState((prev) => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        isValid: validationResult.isValid && value.length > 0,
        isValidating: false,
        isTouched: true,
      },
    }));

    if (!validationResult.isValid && value.length > 0) {
      setErrors((prev) => ({
        ...prev,
        [fieldName]: validationResult.message,
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    // Cross-validate password confirmation
    if (fieldName === 'password' && currentFormData.confirmPassword) {
      const confirmValidation = validatePasswordMatch(
        value,
        currentFormData.confirmPassword
      );
      setValidationState((prev) => ({
        ...prev,
        confirmPassword: {
          ...prev.confirmPassword,
          isValid:
            confirmValidation.isValid &&
            currentFormData.confirmPassword.length > 0,
          isTouched: true,
        },
      }));

      if (
        !confirmValidation.isValid &&
        currentFormData.confirmPassword.length > 0
      ) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: confirmValidation.message,
        }));
      } else {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.confirmPassword;
          return newErrors;
        });
      }
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    const newFormData = {
      ...formData,
      [name]: value,
    };
    setFormData(newFormData);

    // Mark field as touched when user starts typing
    if (!validationState[name]?.isTouched) {
      setValidationState((prev) => ({
        ...prev,
        [name]: { ...prev[name], isTouched: true },
      }));
    }

    // Clear existing errors
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear existing timeout
    if (timeoutRef.current[name]) {
      clearTimeout(timeoutRef.current[name]);
    }

    // For role field, no validation needed - just update state
    if (name === 'role') {
      setValidationState((prev) => ({
        ...prev,
        [name]: { isValid: true, isTouched: true, isValidating: false },
      }));
      return;
    }

    // Set up debounced validation for other fields
    if (value.length > 0) {
      timeoutRef.current[name] = setTimeout(() => {
        validateField(name, value, newFormData);
      }, 500);
    } else {
      // If field is empty, mark as invalid
      setValidationState((prev) => ({
        ...prev,
        [name]: { ...prev[name], isValid: false, isValidating: false },
      }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (!validationState[name]?.isTouched) {
      setValidationState((prev) => ({
        ...prev,
        [name]: { ...prev[name], isTouched: true },
      }));
    }

    if (value.length > 0) {
      if (timeoutRef.current[name]) {
        clearTimeout(timeoutRef.current[name]);
      }
      validateField(name, value, formData);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.message;
      isValid = false;
    }

    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.message;
      isValid = false;
    }

    const usernameValidation = {
      isValid: /^[a-zA-Z0-9_]{3,20}$/.test(formData.username),
      message:
        'Username must be 3-20 characters, letters, numbers, and underscores only',
    };
    if (!usernameValidation.isValid) {
      newErrors.username = usernameValidation.message;
      isValid = false;
    }

    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.message;
      isValid = false;
    }

    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.isValid) {
      newErrors.password = passwordValidation.message;
      isValid = false;
    }

    const passwordMatchValidation = validatePasswordMatch(
      formData.password,
      formData.confirmPassword
    );
    if (!passwordMatchValidation.isValid) {
      newErrors.confirmPassword = passwordMatchValidation.message;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const form = e.currentTarget as HTMLFormElement;
      form.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        form.style.animation = '';
      }, 500);
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
      };

      console.log(userData);

      const res = await register(userData);
      console.log(res);

      // Registration successful, user is automatically logged in
      navigate('/job-board', {
        state: {
          message: 'Registration successful! Welcome to CV Builder.',
          type: 'success',
        },
      });
    } catch (error: any) {
      console.log(error);
      setErrors({
        general: error.message || 'Registration failed. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!formData.password) return null;

    const validation = validatePassword(formData.password);
    const length = formData.password.length;

    if (validation.isValid) {
      return {
        strength: 'strong',
        color: 'text-green-600',
        message: 'Strong password ✓',
        width: '100%',
      };
    } else if (length >= 8) {
      return {
        strength: 'medium',
        color: 'text-yellow-600',
        message: 'Medium strength',
        width: '66%',
      };
    } else if (length >= 4) {
      return {
        strength: 'weak',
        color: 'text-orange-600',
        message: 'Weak password',
        width: '33%',
      };
    }
    return {
      strength: 'very-weak',
      color: 'text-red-600',
      message: 'Very weak password',
      width: '16%',
    };
  };

  const passwordStrength = getPasswordStrength();

  const isFormValid = (() => {
    // Check if all required fields have values
    const hasAllValues =
      formData.firstName.trim().length > 0 &&
      formData.lastName.trim().length > 0 &&
      formData.username.trim().length > 0 &&
      formData.email.trim().length > 0 &&
      formData.password.length > 0 &&
      formData.confirmPassword.length > 0 &&
      formData.role.length > 0;

    // Check if all validations pass
    const allFieldsValid =
      validationState.firstName.isValid &&
      validationState.lastName.isValid &&
      validationState.username.isValid &&
      validationState.email.isValid &&
      validationState.password.isValid &&
      validationState.confirmPassword.isValid &&
      validationState.role.isValid;

    // Check if there are no errors
    const noErrors =
      Object.keys(errors).filter((key) => key !== 'general').length === 0;

    return hasAllValues && allFieldsValid && noErrors;
  })();

  if (isAuthenticated) {
    navigate('/job-board', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
      `}</style>

      <Form
        title="Create your account"
        subtitle="Join CV Builder and create professional resumes"
        error={errors.general}
        onSubmit={handleSubmit}
        spacing="md"
        isLoading={isLoading}
      >
        {/* First Name and Last Name - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField error={!!errors.firstName}>
            <Input
              label="First Name"
              name="firstName"
              type="text"
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.firstName}
              placeholder="Enter your first name"
              leftIcon={<AiOutlineUser size={16} />}
              isValid={validationState.firstName.isValid}
              showValidation={validationState.firstName.isTouched}
              helperText={
                validationState.firstName.isTouched ? (
                  <span
                    className={
                      validationState.firstName.isValid
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                    }
                  >
                    {validationState.firstName.isValid
                      ? 'Perfect! ✓'
                      : 'Must be 2-50 characters, letters only'}
                  </span>
                ) : undefined
              }
              required
            />
          </FormField>

          <FormField error={!!errors.lastName}>
            <Input
              label="Last Name"
              name="lastName"
              type="text"
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.lastName}
              placeholder="Enter your last name"
              leftIcon={<AiOutlineUser size={16} />}
              isValid={validationState.lastName.isValid}
              showValidation={validationState.lastName.isTouched}
              helperText={
                validationState.lastName.isTouched ? (
                  <span
                    className={
                      validationState.lastName.isValid
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                    }
                  >
                    {validationState.lastName.isValid
                      ? 'Perfect! ✓'
                      : 'Must be 2-50 characters, letters only'}
                  </span>
                ) : undefined
              }
              required
            />
          </FormField>
        </div>

        <FormField error={!!errors.username}>
          <Input
            label="Username"
            name="username"
            type="text"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.username}
            placeholder="Choose a username"
            leftIcon={<AiOutlineUser size={16} />}
            isValid={validationState.username.isValid}
            showValidation={validationState.username.isTouched}
            helperText={
              validationState.username.isTouched ? (
                <span
                  className={
                    validationState.username.isValid
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }
                >
                  {validationState.username.isValid
                    ? 'Available! ✓'
                    : '3-20 characters, letters, numbers, and underscores only'}
                </span>
              ) : undefined
            }
            required
          />
        </FormField>

        <FormField error={!!errors.email}>
          <Input
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.email}
            placeholder="Enter your email"
            leftIcon={<AiOutlineMail size={16} />}
            isValid={validationState.email.isValid}
            showValidation={validationState.email.isTouched}
            helperText={
              validationState.email.isTouched ? (
                <span
                  className={
                    validationState.email.isValid
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }
                >
                  {validationState.email.isValid
                    ? 'Valid email address ✓'
                    : 'Enter a valid email address'}
                </span>
              ) : undefined
            }
            required
          />
        </FormField>

        {/* Role Selection */}
        <FormField>
          <label className="block text-sm font-medium text-foreground mb-2">
            Account Type
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            required
          >
            <option value="candidate">Job Seeker (Candidate)</option>
            <option value="hr">HR / Recruiter</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            {formData.role === 'candidate'
              ? 'Create and manage your CV, apply for jobs'
              : 'Post jobs, search candidates, manage recruitment'}
          </p>
        </FormField>

        <FormField error={!!errors.password}>
          <Input
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.password}
            placeholder="Create a password"
            rightIcon={
              showPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )
            }
            onRightIconClick={() => setShowPassword(!showPassword)}
            isValid={validationState.password.isValid}
            showValidation={validationState.password.isTouched}
            helperText={
              validationState.password.isTouched ? (
                <div className="space-y-2">
                  {passwordStrength && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={passwordStrength.color}>
                          {passwordStrength.message}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full transition-all duration-300 ${
                            passwordStrength.strength === 'strong'
                              ? 'bg-green-500'
                              : passwordStrength.strength === 'medium'
                              ? 'bg-yellow-500'
                              : passwordStrength.strength === 'weak'
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                    </div>
                  )}
                  {!validationState.password.isValid && (
                    <span className="text-muted-foreground text-xs">
                      Must contain uppercase, lowercase, number, and special
                      character
                    </span>
                  )}
                </div>
              ) : undefined
            }
            required
          />
        </FormField>

        <FormField error={!!errors.confirmPassword}>
          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            rightIcon={
              showConfirmPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )
            }
            onRightIconClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
            isValid={validationState.confirmPassword.isValid}
            showValidation={validationState.confirmPassword.isTouched}
            helperText={
              validationState.confirmPassword.isTouched ? (
                <span
                  className={
                    validationState.confirmPassword.isValid
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }
                >
                  {validationState.confirmPassword.isValid
                    ? 'Passwords match ✓'
                    : 'Must match the password above'}
                </span>
              ) : undefined
            }
            required
          />
        </FormField>

        <FormActions>
          <Button
            type="submit"
            disabled={isLoading || !isFormValid}
            className={`w-full ${
              !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            size="lg"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                Creating account...
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </FormActions>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Login in here
            </Link>
          </p>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Link
                  to="/terms"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Terms
                </Link>{' '}
                of Service
              </span>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default Register;
