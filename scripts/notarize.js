// macOS notarization script for electron-builder afterSign hook.
// Requires @electron/notarize as a dev dependency.
// Credentials are read from environment variables — configure them in
// GitHub Actions secrets or your local environment.

const { notarize } = require("@electron/notarize");
const path = require("path");

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize on macOS builds.
  if (electronPlatformName !== "darwin") {
    console.log("Skipping notarization — not a macOS build.");
    return;
  }

  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.log(
      "Skipping notarization — APPLE_ID, APPLE_APP_SPECIFIC_PASSWORD, or APPLE_TEAM_ID not set."
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`Notarizing ${appPath} ...`);

  await notarize({
    appPath,
    appleId,
    appleIdPassword,
    teamId,
  });

  console.log("Notarization complete.");
};
