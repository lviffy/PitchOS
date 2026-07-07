export interface TelemetryPayload {
  action?: string;
  category?: string;
  success?: boolean;
  [key: string]: unknown;
}

export function trackEvent(eventName: string, payload: TelemetryPayload = {}) {
  // Telemetry disabled by user request
  return;
}

export function setTelemetryOptIn(optIn: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pitchos_telemetry_optin', 'false');
}

export function isTelemetryOptedIn(): boolean {
  return false;
}
