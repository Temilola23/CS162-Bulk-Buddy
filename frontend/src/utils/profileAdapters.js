import { getInitials } from './avatar';

/**
 * Maps the current user API payload into the profile/header display shape.
 *
 * @param {Object|null} user - Current user API payload.
 * @param {Object|null} fallbackProfile - Optional fallback profile values.
 * @returns {Object|null} Profile display model or null when no user exists.
 */
export function getProfileFromUser(user, fallbackProfile = null) {
  if (!user) {
    return fallbackProfile;
  }

  return {
    name: user.full_name,
    initials: getInitials(user.full_name),
    role: user.role ? user.role[0].toUpperCase() + user.role.slice(1) : 'Shopper',
    email: user.email,
    address: [user.address_street, user.address_city, user.address_state, user.address_zip]
      .filter(Boolean)
      .join(', '),
    nearbyRadius: fallbackProfile?.nearbyRadius || '5 miles',
  };
}
