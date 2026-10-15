const http = require('http');
const url = require('url');
const { google } = require('googleapis');
const { PrismaClient } = require('../prisma/generated/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = "http://localhost:3000/api/auth/callback/google";

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent select_account",
  scope: [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email",
  ],
});

const server = http.createServer(async (req, res) => {
  const reqUrl = url.parse(req.url, true);

  if (reqUrl.pathname === '/') {
    res.writeHead(302, { Location: authUrl });
    res.end();
    return;
  }

  if (reqUrl.pathname === '/api/auth/callback/google') {
    const code = reqUrl.query.code;
    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h3>Error: Missing authorization code.</h3>');
      return;
    }

    try {
      console.log('Exchanging code for tokens...');
      const { tokens } = await oauth2Client.getToken(code);
      console.log('Tokens received!');
      console.log('Has refresh_token:', Boolean(tokens.refresh_token));

      if (tokens.refresh_token) {
        console.log('NEW REFRESH TOKEN:', tokens.refresh_token);

        // Update database
        await prisma.googleDriveConfigRecord.upsert({
          where: { id: 'active' },
          create: {
            id: 'active',
            enabled: true,
            authMethod: 'OAUTH2',
            folderId: '1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J',
            folderName: 'sunlife solar',
            folderLink: 'https://drive.google.com/drive/folders/1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J',
            accountEmail: 'abhishekverma092k2@gmail.com',
            clientId,
            clientSecret,
            refreshToken: tokens.refresh_token,
          },
          update: {
            enabled: true,
            authMethod: 'OAUTH2',
            folderId: '1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J',
            folderName: 'sunlife solar',
            refreshToken: tokens.refresh_token,
            updatedAt: new Date(),
          },
        });
        console.log('Database updated successfully with permanent refresh token!');

        // Update local .env
        const envPath = path.join(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          let env = fs.readFileSync(envPath, 'utf8');
          env = env.replace(/^GOOGLE_DRIVE_REFRESH_TOKEN=.*$/m, `GOOGLE_DRIVE_REFRESH_TOKEN="${tokens.refresh_token}"`);
          fs.writeFileSync(envPath, env, 'utf8');
          console.log('.env updated with new token!');
        }
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #16a34a;">&#x2705; Google Drive Connected Permanently!</h1>
          <p>Your permanent offline token is saved in the database.</p>
          <p>All future uploads will save directly into <b>sunlife solar</b> Google Drive folder.</p>
          <p>You can close this tab now.</p>
        </div>
      `);

      setTimeout(() => {
        server.close();
        prisma.$disconnect();
        process.exit(0);
      }, 2000);

    } catch (err) {
      console.error('Token Exchange Error:', err);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h3>Error: ${err.message}</h3>`);
    }
  }
});

server.listen(3000, () => {
  console.log('--------------------------------------------------');
  console.log('Google Drive Token Link Server running on http://localhost:3000');
  console.log('Open this link in your browser to authorize:');
  console.log(authUrl);
  console.log('--------------------------------------------------');
});
