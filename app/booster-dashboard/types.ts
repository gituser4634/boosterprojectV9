export type IncomingRequest = {
  id: string;
  game: string;
  detail: string;
  amount: number;
  etaHours: number;
  tone: "secondary" | "tertiary";
};

export type ActiveOrder = {
  id: string;
  name: string;
  customer: string;
  pct: number;
};

export type MessageItem = {
  id: string;
  user: string;
  time: string;
  msg: string;
  img: string;
  border: string;
};

export type ActivityItem = {
  id: string;
  time: string;
  msg: string;
  tone: "primary" | "secondary";
};

export type DashboardData = {
  sessionActive: string;
  activeOrdersCount: number;
  activeOrdersDeltaPct: number;
  pendingRequestsCount: number;
  newRequestsCount: number;
  monthlyEarnings: number;
  newMessagesCount: number;
  incomingRequests: IncomingRequest[];
  activeOrders: ActiveOrder[];
  trendPoints: number[];
  trendGrowthPct: number;
  trendAvgWeekly: number;
  recentMessages: MessageItem[];
  activityFeed: ActivityItem[];
  eliteTopPct: number;
  eliteRating: number;
  unreadNotifications: number;
};

export const emptyDashboardData: DashboardData = {
  sessionActive: "0h 00m",
  activeOrdersCount: 0,
  activeOrdersDeltaPct: 0,
  pendingRequestsCount: 0,
  newRequestsCount: 0,
  monthlyEarnings: 0,
  newMessagesCount: 0,
  incomingRequests: [],
  activeOrders: [],
  trendPoints: [0, 0, 0, 0, 0, 0, 0, 0],
  trendGrowthPct: 0,
  trendAvgWeekly: 0,
  recentMessages: [],
  activityFeed: [],
  eliteTopPct: 0,
  eliteRating: 0,
  unreadNotifications: 0,
};
