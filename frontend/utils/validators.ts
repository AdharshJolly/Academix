/**
 * Form Validation Utilities
 */

export function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

export function isValidPassword(password: string): boolean {
    // Min 8 characters
    return password.length >= 8;
}
