import Link from 'next/link';
import { Logo } from './logo';

const PRODUCT_LINKS = [
  { href: '/jobs', label: 'Browse Jobs' },
  { href: '/search', label: 'Search' },
  { href: '/jobs/new', label: 'Post a Job' },
];

const COMPANY_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Logo />
            <p className="mt-4 text-bodySm text-slate-500 dark:text-slate-400 max-w-xs">
              Where great work meets great talent. Post a job, hire a
              freelancer, or start your next project.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-bodySm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-bodySm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-bodySm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-bodySm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-bodySm font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-bodySm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-caption text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} WorkLabs. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-caption text-slate-500 dark:text-slate-400">
            <span>Made in India 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}