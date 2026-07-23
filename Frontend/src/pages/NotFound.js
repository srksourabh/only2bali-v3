import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Catch-all for unmatched URLs.
 *
 * The router previously had no fallback, so any unknown path rendered an empty
 * page and the host returned HTTP 200 — which told Google that every typo,
 * every stale link and every probe was a real page worth indexing.
 *
 * A single-page app served from a static host cannot set a 404 status itself,
 * so this does the next best thing: it says plainly that the page does not
 * exist, and adds `noindex` so crawlers drop it rather than keep it.
 */
export default function NotFound() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, follow';
    document.head.appendChild(meta);

    const previousTitle = document.title;
    document.title = 'Page not found — Only2Bali';

    return () => {
      document.head.removeChild(meta);
      document.title = previousTitle;
    };
  }, []);

  return (
    <main style={{ maxWidth: '38rem', margin: '0 auto', padding: '8rem 1.5rem', textAlign: 'center' }}>
      <p style={{ letterSpacing: '.12em', textTransform: 'uppercase', fontSize: '.75rem', opacity: 0.6 }}>
        404
      </p>
      <h1 style={{ margin: '.6rem 0 1rem' }}>We could not find that page.</h1>
      <p style={{ opacity: 0.75, marginBottom: '2rem' }}>
        The link may be out of date, or the address may have a typo in it.
      </p>
      <Link to="/" style={{ fontWeight: 600 }}>
        Go to the home page
      </Link>
    </main>
  );
}
