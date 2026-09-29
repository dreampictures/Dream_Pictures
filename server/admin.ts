// Admin authentication
const isProduction = process.env.NODE_ENV === "production";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || (isProduction ? "" : "714752420017");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || (isProduction ? "" : "Ba@606368");

export function validateAdminCredentials(username: string, password: string): boolean {
  return Boolean(ADMIN_USERNAME && ADMIN_PASSWORD && username === ADMIN_USERNAME && password === ADMIN_PASSWORD);
}
