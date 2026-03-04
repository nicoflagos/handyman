import React from 'react';
import privacyText from '../legal/PRIVACY.md?raw';
import { LegalDoc } from './LegalDoc';

export default function Privacy() {
  return <LegalDoc title="Privacy Policy" text={privacyText} />;
}

