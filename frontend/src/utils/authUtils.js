/**
 * Returns the appropriate dashboard path based on user role.
 * @param {string} role - The role of the authenticated user.
 * @returns {string} - The redirect path.
 */
export const getRedirectPath = (role) => {
  switch (role) {
    case "admin":
    case "super_admin":
    case "emergency_admin":
      return "/admin";
    case "volunteer":
      return "/volunteer/dashboard";
    case "rescue_team":
    case "rescue":
      return "/admin/rescue";
    default:
      return "/user/dashboard";
  }
};
