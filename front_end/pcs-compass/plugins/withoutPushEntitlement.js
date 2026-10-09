const { withEntitlementsPlist } = require('expo/config-plugins');

// expo-notifications always asks iOS for the Push Notifications capability, but free Apple accounts
// can't sign apps that have it. We only use reminders scheduled on the device, which don't need it.
// It has to be listed first in app.json: plugins listed earlier get the last word on the entitlements file.
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (c) => {
    delete c.modResults['aps-environment'];
    return c;
  });
};
