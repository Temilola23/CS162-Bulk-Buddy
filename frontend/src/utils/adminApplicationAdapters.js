export const ADMIN_STATUS_TABS = [
  { id: 'pending', label: 'Pending', endpoint: '/admin/pending', responseKey: 'pending_apps' },
  { id: 'approved', label: 'Approved', endpoint: '/admin/approved', responseKey: 'approved_apps' },
  { id: 'rejected', label: 'Rejected', endpoint: '/admin/rejected', responseKey: 'rejected_apps' },
];

function parseLicenseInfo(licenseInfo) {
  const normalizedLicenseInfo = (licenseInfo || '').trim();
  if (!normalizedLicenseInfo) {
    return {
      licenseNumber: 'Not submitted',
      expirationDate: 'Not submitted',
    };
  }

  const parsedMatch = normalizedLicenseInfo.match(/^(.*?)\s*\|\s*exp\s+(.+)$/i);
  if (!parsedMatch) {
    return {
      licenseNumber: normalizedLicenseInfo,
      expirationDate: 'Not submitted',
    };
  }

  return {
    licenseNumber: parsedMatch[1].trim(),
    expirationDate: parsedMatch[2].trim(),
  };
}

function formatStatusLabel(status) {
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return 'No date';
  }

  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function mapAdminApplication(apiApplication) {
  const parsedLicense = parseLicenseInfo(apiApplication.license_info);

  return {
    id: apiApplication.driver_application_id,
    userId: apiApplication.user_id,
    status: apiApplication.status,
    statusLabel: formatStatusLabel(apiApplication.status),
    createdAt: apiApplication.created_at,
    createdAtLabel: formatTimestamp(apiApplication.created_at),
    updatedAtLabel: formatTimestamp(apiApplication.updated_at),
    ...parsedLicense,
  };
}

export async function fetchAdminApplications(api) {
  // The current backend does not have one aggregate admin queue endpoint, so
  // the frontend loads each status bucket and merges them into one collection.
  const responses = await Promise.all(
    ADMIN_STATUS_TABS.map(async (tab) => {
      const response = await api.get(tab.endpoint);
      return { tab, response };
    }),
  );

  const failedResponse = responses.find(({ response }) => !response.ok);
  if (failedResponse) {
    return {
      applications: [],
      error: failedResponse.response.body?.message || 'Unable to load admin applications.',
      status: failedResponse.response.status,
    };
  }

  const applications = responses.flatMap(({ tab, response }) =>
    (response.body?.[tab.responseKey] || []).map(mapAdminApplication),
  );

  applications.sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();
    return rightTime - leftTime;
  });

  return {
    applications,
    error: null,
    status: 200,
  };
}
