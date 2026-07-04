import React from "react";
import { Link, useLocation } from 'react-router-dom';

function BreadCrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const sep = <span style={{ margin: '0 6px', color: '#94a3b8', fontSize: 12 }}>/</span>;

  const linkStyle = {
    color: '#475569',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    transition: 'color 0.15s',
  };

  return (
    <nav aria-label="Breadcrumb">
      <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0, padding: 0 }}>
        <li style={{ display: 'flex', alignItems: 'center' }}>
          <Link
            to="/"
            style={linkStyle}
            onMouseEnter={e => { e.currentTarget.style.color = '#2563eb'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
          >
            Home
          </Link>
          {segments.length > 0 && sep}
        </li>

        {segments.map((segment, index) => {
          const path = '/' + segments.slice(0, index + 1).join('/');
          const isLast = index === segments.length - 1;

          const label = segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

          return (
            <li key={index} style={{ display: 'flex', alignItems: 'center' }}>
              {isLast ? (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                  {label}
                </span>
              ) : (
                <>
                  <Link
                    to={path}
                    style={linkStyle}
                    onMouseEnter={e => { e.currentTarget.style.color = '#2563eb'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
                  >
                    {label}
                  </Link>
                  {sep}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default BreadCrumb;
