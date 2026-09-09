const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Google Android Developer Verification — one-time proof-of-ownership file.
// Remove this plugin and app.json entry once the key is verified in Play Console.
const SNIPPET = 'DEXMRZT5KVO5IAAAAAAAAAAAAA';

module.exports = function withAdiRegistration(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const assetsDir = path.join(
        config.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'assets'
      );
      fs.mkdirSync(assetsDir, { recursive: true });
      fs.writeFileSync(path.join(assetsDir, 'adi-registration.properties'), SNIPPET + '\n');
      return config;
    },
  ]);
};
