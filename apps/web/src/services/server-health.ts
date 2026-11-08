import { API_BASE_URL } from './api-client';

let wakeUpStarted = false;
let isServerAwake = false;

/**
 * Triggers a non-blocking background wake-up ping to the backend.
 * Render free tier instances spin down after 15 minutes of inactivity;
 * hitting /health on page load spins up the container immediately so that
 * subsequent user interactions (shortening links, login, dashboard) are fast and responsive.
 */
export async function wakeUpServer(): Promise<boolean> {
  if (isServerAwake) return true;
  if (wakeUpStarted) return false;

  wakeUpStarted = true;

  try {
    const res = await fetch(`${API_BASE_URL}/health?warmup=true`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (res.ok) {
      isServerAwake = true;
      return true;
    }
  } catch {
    // If backend was sleeping and the connection times out or drops during cold start,
    // retry once after 2.5 seconds.
    setTimeout(async () => {
      try {
        const retryRes = await fetch(`${API_BASE_URL}/health?warmup=true`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });
        if (retryRes.ok) {
          isServerAwake = true;
        }
      } catch {
        // Silently catch background errors to prevent noisy console logs
      }
    }, 2500);
  }

  return false;
}
