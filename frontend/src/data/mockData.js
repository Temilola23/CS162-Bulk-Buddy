export const claimStatuses = ["Claimed", "Purchased", "ReadyForPickup", "Completed"];

export const publicPreviewTrip = {
  id: "preview-costco",
  distance: "0.8 miles away",
  status: "Open",
  store: "Costco",
  time: "Sat, Mar 14 • 3:00-5:00 PM",
  pickup: "Mission District, 16th St BART Plaza",
  driver: "Alex",
  itemsLabel: "Rice, chicken, eggs",
  capacityLeft: 3,
};

export const trips = [
  {
    id: "costco-mission",
    distance: 0.8,
    distanceLabel: "0.8 miles away",
    status: "Open",
    store: "Costco",
    time: "Sat, Mar 14 • 3:00-5:00 PM",
    pickup: "Mission District, 16th St BART Plaza",
    driver: "Alex",
    itemsLabel: "Kirkland Rice 25lb, Chicken Breasts",
    capacityLeft: 3,
  },
  {
    id: "sams-soma",
    distance: 1.2,
    distanceLabel: "1.2 miles away",
    status: "Open",
    store: "Sam's Club",
    time: "Sun, Mar 15 • 10:00-11:30 AM",
    pickup: "SoMa, 4th & King Caltrain",
    driver: "Marisol",
    itemsLabel: "Eggs 24-pack, Greek Yogurt, Avocados",
    capacityLeft: 2,
  },
  {
    id: "costco-duboce",
    distance: 2.6,
    distanceLabel: "2.6 miles away",
    status: "Open",
    store: "Costco",
    time: "Mon, Mar 16 • 6:30-8:00 PM",
    pickup: "Duboce Triangle, Church St Station",
    driver: "Jonathan",
    itemsLabel: "Chicken Breasts, Broccoli Florets",
    capacityLeft: 1,
  },
];

export const tripDetails = {
  "costco-mission": {
    id: "costco-mission",
    store: "Costco",
    titleDate: "Sat, Mar 14",
    pickupTitle: "Mission District",
    pickupSubtitle: "16th St BART Plaza, 6:30 PM",
    driver: "Alex",
    distanceLabel: "0.8 miles away",
    capacityLeft: 3,
    status: "Open",
    note: 'Text me if you\'re running late. I\'ll wait 10 minutes.',
    items: [
      {
        id: "rice",
        name: "Kirkland Rice 25lb",
        unit: "bag",
        totalShares: 4,
        claimedShares: 1,
        availableShares: 3,
        approxPrice: 6,
        quantity: 1,
      },
      {
        id: "chicken",
        name: "Chicken Breasts",
        unit: "lb",
        totalShares: 5,
        claimedShares: 3,
        availableShares: 2,
        approxPrice: 4.5,
        quantity: 2,
      },
    ],
    rules: [
      ["Request scope", "Driver's predefined item list only"],
      ["Status on submit", "Claimed"],
      ["Oversell prevention", "UI caps quantity at available shares"],
    ],
  },
};

export const orderGroups = {
  upcoming: [
    {
      trip: "Costco • Sat, Mar 14 • Mission District",
      summary: "Driver: Alex · Pickup at 6:30 PM · 0.8 miles away",
      items: [
        { name: "Kirkland Rice 25lb", quantity: "1 share", current: "Claimed" },
        { name: "Chicken Breasts", quantity: "2 shares", current: "Claimed" },
      ],
    },
  ],
  past: [
    {
      trip: "Sam's Club • Sun, Mar 1 • SoMa",
      summary: "Driver: Marisol · Pickup completed · 1.2 miles away",
      items: [{ name: "Eggs 24-pack", quantity: "1 share", current: "Completed" }],
    },
  ],
};

export const driverTrips = {
  open: [
    {
      title: "Costco • Sat, Mar 14",
      subtitle: "Status: open · Pickup: Mission District, 16th St BART, 6:30 PM",
      status: "Open",
      capacityLine: "3 / 4 slots filled",
      claims: [
        ["Rice claims", "1 / 4 shares claimed"],
        ["Chicken claims", "3 / 5 shares claimed"],
      ],
      fillPercent: 75,
    },
  ],
  closed: [
    {
      title: "Sam's Club • Sun, Mar 8",
      subtitle: "Status: closed · Pickup: SoMa, 4th & King Caltrain, 11:30 AM",
      status: "Closed",
      capacityLine: "4 / 4 slots filled",
      claims: [
        ["Egg claims", "4 / 4 shares claimed"],
        ["Yogurt claims", "3 / 3 shares claimed"],
      ],
      fillPercent: 100,
    },
  ],
  past: [
    {
      title: "Costco • Sat, Feb 22",
      subtitle: "Status: completed · Pickup: Duboce Triangle, 5:30 PM",
      status: "Completed",
      capacityLine: "2 / 3 slots filled",
      claims: [
        ["Rice claims", "2 / 4 shares claimed"],
        ["Egg claims", "2 / 2 shares claimed"],
      ],
      fillPercent: 67,
    },
  ],
};

export const profileUser = {
  initials: "TY",
  name: "Tara Yang",
  role: "Shopper",
  email: "tara@example.edu",
  address: "145 Valencia St, San Francisco, CA 94103",
  radius: "5 miles",
};

export const driverApplication = {
  status: "Pending",
  headline: "Application under review",
  body: "An admin will review your license number, expiration date, and proof image.",
  banner: "Post Trip remains locked while status is pending.",
  fields: [
    ["License number", "D1234567"],
    ["Expiration date", "2028-04-12"],
    ["Proof image", "license-front.jpg"],
  ],
};

export const driverApplicationStates = {
  "Not Applied": {
    status: "Not Applied",
    title: "Become a Driver",
    body: "You are currently a Shopper. Submit license details and proof to apply.",
    primaryAction: "Apply to become a Driver",
  },
  Pending: {
    status: "Pending",
    title: "Application under review",
    body: "An admin will review your license number, expiration date, and proof image.",
    banner: "Post Trip remains locked while status is pending.",
  },
  Approved: {
    status: "Approved",
    title: "You're a verified driver",
    body: "You can now create trips, manage claims, and update claim status progression.",
    primaryAction: "Post your first trip",
    actionTone: "teal",
  },
  Rejected: {
    status: "Rejected",
    title: "Application not approved",
    body: "You remain a Shopper only. Contact support or reapply with updated proof.",
    primaryAction: "Contact support",
    secondaryAction: "Reapply",
  },
};
