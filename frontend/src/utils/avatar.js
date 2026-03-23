export function getInitials(name = '') {
  const segments = name.trim().split(/\s+/).filter(Boolean);
  if (!segments.length) {
    return 'BB';
  }

  return segments
    .slice(0, 2)
    .map((segment) => segment[0])
    .join('')
    .toUpperCase();
}

export function createAvatarImage(name, backgroundColor = '#4d216a') {
  const initials = getInitials(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <rect width="96" height="96" fill="${backgroundColor}" rx="48" />
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" font-size="35" font-family="Geologica, sans-serif" font-weight="700">
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
