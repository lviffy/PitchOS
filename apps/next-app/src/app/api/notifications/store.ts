export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const pushSubscriptions = new Map<string, PushSubscriptionData[]>();
