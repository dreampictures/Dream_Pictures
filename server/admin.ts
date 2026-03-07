// Admin authentication
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "714752420017";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Ba@606368";

export function validateAdminCredentials(username: string, password: string): boolean {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
