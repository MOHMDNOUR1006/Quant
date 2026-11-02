/**
 * QUANT AI — System Configuration
 * 
 * Local agent connection settings. Firebase client configuration and authentication
 * are managed by firebase-auth.js.
 */

const AuthConfig = {
    // Local Agent WebSocket URL
    LOCAL_AGENT_URL: 'ws://127.0.0.1:8081',
    // Public OAuth client ID for the native Windows/Linux desktop app.
    // Create an OAuth client with type "Desktop app" in Google Cloud Console.
    GOOGLE_DESKTOP_CLIENT_ID: '488372429688-f8a11vquvif7uujpjf065qbtrs541ek8.apps.googleusercontent.com'
};

window.AuthConfig = AuthConfig;
