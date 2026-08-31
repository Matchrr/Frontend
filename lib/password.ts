/** Xano user.password: min 8, at least one letter and one digit. */
export function passwordPolicyMessage(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Password must include a letter.";
  if (!/\d/.test(password)) return "Password must include a number.";
  return null;
}
