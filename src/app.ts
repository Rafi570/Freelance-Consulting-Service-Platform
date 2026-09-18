import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import globalErrorHandler from './app/errors/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import router from './app/routes';

const app: Application = express();

app.use(express.json());
app.use(cors());

// Application Routes
app.use('/api/v1', router);

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Freelance & Consulting Service Platform API is running 🚀',
  });
});

// Google Authentication Test Page (for Localhost & Vercel)
app.get('/test-google', (req: Request, res: Response) => {
  const googleClientId =
    process.env.GOOGLE_CLIENT_ID ||
    '1029695050935-1f0tk8ulr5dq396kf4ll5c36e8ud7k3s.apps.googleusercontent.com';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Google Login Test | Freelance & Consulting Platform</title>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 580px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(59,130,246,0.15); color: #60a5fa; border: 1px solid rgba(59,130,246,0.3); border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
    h1 { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 8px; }
    p { font-size: 14px; color: #94a3b8; }
    .client-box { background: #0f172a; border: 1px dashed #475569; border-radius: 8px; padding: 12px; font-size: 11px; word-break: break-all; color: #cbd5e1; margin: 16px 0; }
    .role-select { margin: 16px 0; }
    .role-select label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #e2e8f0; }
    .roles { display: flex; gap: 12px; }
    .role-btn { flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #475569; background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 13px; cursor: pointer; transition: all 0.2s; text-align: center; }
    .role-btn.active { border-color: #3b82f6; background: rgba(59,130,246,0.2); color: #60a5fa; }
    .btn-container { display: flex; justify-content: center; margin: 24px 0; }
    .result-box { background: #090d16; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-top: 20px; font-family: monospace; font-size: 12px; color: #10b981; max-height: 250px; overflow-y: auto; display: none; white-space: pre-wrap; word-break: break-all; }
    .token-preview { margin-top: 12px; padding: 12px; background: #1e1b4b; border: 1px solid #4338ca; border-radius: 8px; font-size: 12px; color: #a5b4fc; display: none; word-break: break-all; }
    .actions { display: flex; gap: 10px; margin-top: 12px; }
    .action-btn { flex: 1; padding: 8px; border-radius: 6px; border: none; font-weight: 600; font-size: 12px; cursor: pointer; background: #3b82f6; color: #fff; transition: opacity 0.2s; }
    .action-btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Google OAuth 2.0 Integration</div>
      <h1>Google Login Live Test</h1>
      <p>Sign in with your Google account to test backend authentication.</p>
    </div>

    <div class="client-box">
      <strong>Client ID:</strong> ${googleClientId}
    </div>

    <div class="role-select">
      <label>Register / Login As:</label>
      <div class="roles">
        <div class="role-btn active" id="btn-provider" onclick="setRole('PROVIDER')">💼 PROVIDER</div>
        <div class="role-btn" id="btn-client" onclick="setRole('CLIENT')">👤 CLIENT</div>
      </div>
    </div>

    <div id="g_id_onload"
         data-client_id="${googleClientId}"
         data-callback="handleCredentialResponse"
         data-auto_prompt="false">
    </div>

    <div class="btn-container">
      <div class="g_id_signin"
           data-type="standard"
           data-size="large"
           data-theme="filled_blue"
           data-text="sign_in_with"
           data-shape="pill"
           data-logo_alignment="left">
      </div>
    </div>

    <div id="status-msg" style="text-align: center; font-size: 13px; color: #f59e0b; display: none;">Authenticating with backend...</div>

    <div id="result" class="result-box"></div>
    <div id="token-box" class="token-preview"></div>
  </div>

  <script>
    let selectedRole = 'PROVIDER';
    function setRole(role) {
      selectedRole = role;
      document.getElementById('btn-provider').className = role === 'PROVIDER' ? 'role-btn active' : 'role-btn';
      document.getElementById('btn-client').className = role === 'CLIENT' ? 'role-btn active' : 'role-btn';
    }

    async function handleCredentialResponse(response) {
      const statusMsg = document.getElementById('status-msg');
      const resultBox = document.getElementById('result');
      const tokenBox = document.getElementById('token-box');
      const googleToken = response.credential;

      statusMsg.style.display = 'block';
      statusMsg.innerText = 'Verifying Google ID Token with backend (/api/v1/auth/google-login)...';

      try {
        const res = await fetch('/api/v1/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idToken: googleToken,
            role: selectedRole,
          }),
        });

        const data = await res.json();
        statusMsg.style.display = 'none';

        resultBox.style.display = 'block';
        resultBox.innerText = JSON.stringify(data, null, 2);

        tokenBox.style.display = 'block';
        tokenBox.innerHTML =
          '<div style="margin-bottom:8px;"><strong>1. Google ID Token (Credential):</strong></div>' +
          '<div style="background:#0f172a; padding:8px; border-radius:4px; font-size:10px; max-height:80px; overflow-y:auto; word-break:break-all; margin-bottom:8px;">' + googleToken + '</div>' +
          '<div class="actions" style="margin-bottom:12px;">' +
          '<button class="action-btn" onclick="navigator.clipboard.writeText(\\'' + googleToken + '\\'); alert(\\'Google ID Token Copied! Paste this in Postman idToken field.\\');">📋 Copy Google idToken for Postman</button>' +
          '</div>' +
          (data.success && data.data?.accessToken ?
          '<div style="margin-bottom:8px;"><strong>2. Platform JWT Access Token:</strong></div>' +
          '<div style="background:#0f172a; padding:8px; border-radius:4px; font-size:10px; max-height:80px; overflow-y:auto; word-break:break-all; margin-bottom:8px;">' + data.data.accessToken + '</div>' +
          '<div class="actions">' +
          '<button class="action-btn" style="background:#10b981;" onclick="navigator.clipboard.writeText(\\'' + data.data.accessToken + '\\'); alert(\\'Platform Access Token Copied!\\');">📋 Copy Platform JWT Token</button>' +
          '</div>' : '');
      } catch (err) {
        statusMsg.innerText = 'Error: ' + err.message;
      }
    }
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Global Error Handler
app.use(globalErrorHandler);

// Not Found Route Handler
app.use(notFound);

export default app;
