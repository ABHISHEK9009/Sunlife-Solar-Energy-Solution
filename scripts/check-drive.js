const { google } = require('googleapis');
const auth = new google.auth.GoogleAuth({
  keyFile: 'service-account.json',
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });

async function run() {
  try {
    const res = await drive.files.list({
      q: "'1G1SVWYntTNcX3Zfjh4WvlASbRkcmEM9J' in parents and trashed = false",
      fields: "files(id, name, createdTime)",
      pageSize: 10,
    });
    console.log("COUNT:", res.data.files.length);
    console.log(JSON.stringify(res.data.files, null, 2));
  } catch (e) {
    console.error("ERROR:", e.message);
  }
}
run();
