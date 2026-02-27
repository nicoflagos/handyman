import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { Button } from './ui/Button';
import { listServices, ServiceItem } from './services/catalog';

export default function Home() {
  const auth = useAuth();
  const [services, setServices] = useState<ServiceItem[] | null>(null);

  useEffect(() => {
    let mounted = true;
    listServices()
      .then(items => {
        if (!mounted) return;
        setServices(items);
      })
      .catch(() => {
        if (!mounted) return;
        setServices(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const popular = useMemo(() => {
    if (Array.isArray(services) && services.length) return services.slice(0, 8);
    return [
      { key: 'general_handyman', name: 'General handyman', description: 'Repairs and odd jobs' },
      { key: 'ac_technician', name: 'AC technician', description: 'Installation and servicing' },
      { key: 'electrician', name: 'Electrician', description: 'Wiring and power issues' },
      { key: 'mechanic', name: 'Mechanic', description: 'Vehicle repairs' },
      { key: 'plumber', name: 'Plumber', description: 'Leaks and pipe work' },
      { key: 'barber', name: 'Barber', description: 'Haircut and grooming' },
      { key: 'hair_stylist', name: 'Hair stylist', description: 'Hair styling and care' },
      { key: 'tailor', name: 'Tailor', description: 'Alterations and fittings' },
    ] as ServiceItem[];
  }, [services]);

  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10 }}>
        {auth.token ? (
          <Link to="/dashboard">
            <Button variant="ghost">Go to dashboard</Button>
          </Link>
        ) : (
          <>
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/register">
              <Button>Register</Button>
            </Link>
          </>
        )}
      </div>

      <section className="landingHero">
        <div className="landingKicker" style={{ justifyContent: 'center', margin: '0 auto 14px' }}>
          On-demand service marketplace
        </div>
        <h1>Book help fast!</h1>
        <p style={{ fontSize: 20, marginTop: 10, color: 'var(--color-text-secondary)' }}>
          Connect with local skilled workers, technicians and artisans in your area
        </p>
        <p style={{ fontSize: 16, marginTop: 8, color: 'var(--color-text-muted)' }}>Track everything.</p>

        <div className="landingCtas">
          {auth.token ? (
            <Link to="/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button>Register</Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="sectionAlt">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h2>How it works</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Get help in three simple steps
            </p>
          </div>

          <div className="grid3">
            <div className="landingCard">
              <h4 style={{ marginBottom: 8 }}>1) Post your request</h4>
              <p className="muted" style={{ margin: 0 }}>
                Describe what you need, set your location, and propose a service fee (excluding materials cost).
              </p>
            </div>
            <div className="landingCard">
              <h4 style={{ marginBottom: 8 }}>2) Get matched</h4>
              <p className="muted" style={{ margin: 0 }}>
                Your request reaches nearby handymen in your Local Council.
              </p>
            </div>
            <div className="landingCard">
              <h4 style={{ marginBottom: 8 }}>3) Get it done</h4>
              <p className="muted" style={{ margin: 0 }}>
                Track progress, verify with start/completion codes, and settle securely through escrow.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h2>Popular services</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Find skilled professionals for any task
            </p>
          </div>

          <div className="grid4">
            {popular.map(s => (
              <Link key={s.key} to={auth.token ? '/services' : '/register'} style={{ textDecoration: 'none' }}>
                <div className="landingCard" style={{ height: '100%' }}>
                  <h5 style={{ marginBottom: 6 }}>{s.name}</h5>
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                    {s.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="sectionAlt">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h2>Trust & Safety</h2>
            <p className="muted" style={{ marginTop: 8 }}>
              Your peace of mind is our priority
            </p>
          </div>

          <div className="grid4">
            <div className="landingCard">
              <h5 style={{ marginBottom: 6 }}>Verified flow</h5>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Start and completion codes help confirm the right job at the right time.
              </p>
            </div>
            <div className="landingCard">
              <h5 style={{ marginBottom: 6 }}>Escrow payments</h5>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Funds are held when the job starts and released on completion.
              </p>
            </div>
            <div className="landingCard">
              <h5 style={{ marginBottom: 6 }}>Ratings</h5>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Customers and handymen rate each other after completed work.
              </p>
            </div>
            <div className="landingCard">
              <h5 style={{ marginBottom: 6 }}>Job photos</h5>
              <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                Before/after images help both parties track work quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <span>Handyman</span>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
