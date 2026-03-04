import React from 'react';
import termsText from '../legal/TERMS.md?raw';
import { LegalDoc } from './LegalDoc';

export default function Terms() {
  return <LegalDoc title="Terms & Conditions" text={termsText} />;
}

