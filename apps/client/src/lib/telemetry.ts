export interface TelemetryPayload {
  action?: string;
  category?: string;
  success?: boolean;
  [key: string]: unknown;
}

export function trackEvent(eventName: string, payload: TelemetryPayload = {}) {
  if (typeof window === 'undefined') return;

  const isOptedIn = localStorage.getItem('pitchos_telemetry_optin') !== 'false';
  if (!isOptedIn) return;

  const baseUrl = process.env.NEXT_PUBLIC_SUPPORTING_SERVICES_URL || 'http://localhost:3002';
  
  // Format aggregate payload strictly keeping NO PII or free text fields
  const safePayload = {
    action: payload.action || 'unknown',
    category: payload.category || 'general',
    success: payload.success !== undefined ? payload.success : true,
    timestamp: Date.now()
  };

  fetch(`${baseUrl}/api/telemetry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      eventName,
      payload: safePayload
    })
  }).catch(err => {
    // Fail silently in offline mode
    console.debug('Telemetry queue offline (silently skipped)', err);
  });
}

export function setTelemetryOptIn(optIn: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pitchos_telemetry_optin', optIn.toString());
}

export function isTelemetryOptedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('pitchos_telemetry_optin') !== 'false';
}
