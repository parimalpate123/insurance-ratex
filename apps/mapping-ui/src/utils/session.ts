/**
 * Session ID utility for tracking user sessions
 */

const SESSION_ID_KEY = 'insurratex_session_id';

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get or create session ID
 * Uses sessionStorage so it persists for the browser session
 */
export function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    console.log('New session created:', sessionId);
  }

  return sessionId;
}

/**
 * Clear the session ID (useful for testing)
 */
export function clearSessionId(): void {
  sessionStorage.removeItem(SESSION_ID_KEY);
}

/**
 * Get session info
 */
export function getSessionInfo(): {
  sessionId: string;
  createdAt: Date;
} {
  const sessionId = getSessionId();

  // Extract timestamp from session ID
  const timestamp = parseInt(sessionId.split('_')[1]);

  return {
    sessionId,
    createdAt: new Date(timestamp),
  };
}
