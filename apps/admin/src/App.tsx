import { useTranslation } from 'react-i18next';
import { MANIFEST_PROTOCOL_VERSION } from '@cartelera/shared';

export function App() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold tracking-tight">{t('app.title')}</p>
            <p className="text-sm text-slate-500">{t('app.subtitle')}</p>
          </div>
          <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
            F0
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold">{t('app.subtitle')}</h1>
          <p className="mt-2 text-slate-600">{t('status.summary')}</p>
          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('status.phase')}
              </dt>
              <dd className="mt-1 text-sm font-medium">{t('status.phaseValue')}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t('footer.protocol')}
              </dt>
              <dd className="mt-1 text-sm font-medium">v{MANIFEST_PROTOCOL_VERSION}</dd>
            </div>
          </dl>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              href="/tv/"
            >
              {t('nav.player')}
            </a>
            <a
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              href="/healthz"
            >
              {t('nav.health')}
            </a>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold">{t('roadmap.heading')}</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>{t('roadmap.f1')}</li>
            <li>{t('roadmap.f2')}</li>
            <li>{t('roadmap.f3')}</li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 text-xs text-slate-500">
          <span>
            {t('footer.version')}: 0.1.0 · {t('status.phaseValue')}
          </span>
          <span>
            {t('footer.protocol')}: v{MANIFEST_PROTOCOL_VERSION}
          </span>
        </div>
      </footer>
    </div>
  );
}
