import React from 'react';
import './src/i18n';
import Navigation from './src/navigation';
import { SubscriptionProvider } from './src/context/SubscriptionContext';

export default function App() {
  return (
    <SubscriptionProvider>
      <Navigation />
    </SubscriptionProvider>
  );
}
