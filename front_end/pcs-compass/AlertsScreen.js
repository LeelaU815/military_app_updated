import React from 'react';

import ComingSoon from './components/ComingSoon';

export default function AlertsScreen() {
  return (
    <ComingSoon
      title="Alerts"
      icon="notifications-outline"
      message="Deadlines and status updates, color-coded by how urgent they are."
    />
  );
}
