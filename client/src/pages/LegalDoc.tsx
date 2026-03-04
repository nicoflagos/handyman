import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../ui/Button';

export function LegalDoc({ title, text }: { title: string; text: string }) {
  return (
    <Layout>
      <div className="col" style={{ gap: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 6 }}>{title}</h2>
            <p className="muted" style={{ margin: 0 }}>
              Last updated: 2026-03-04
            </p>
          </div>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <Button variant="ghost">Back to Register</Button>
          </Link>
        </div>

        <div className="card">
          <div className="cardInner">
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55, fontSize: 14 }}>{text}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

