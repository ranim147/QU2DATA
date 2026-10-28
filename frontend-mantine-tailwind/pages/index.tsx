import Link from "next/link";
import { useTranslation } from "next-i18next";
import {
  IconDatabaseImport,
  IconAdjustmentsHorizontal,
  IconChartHistogram,
  IconFlask,
  IconChartPie,
  IconFileAnalytics,
  IconUpload,
  IconChartDots,
  IconShare,
  IconArrowRight,
} from "@tabler/icons-react";
import { withTranslations } from "../src/helpers/HOC/withTranslations";
import { DashboardMockup } from "../src/components/home/ChartIllustrations";
import { useAuthContext } from "src/context/AuthContext";

const CARD =
  "bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/70 hover:border-[#84BF43]/40 transition-all duration-300";

export default function Home() {
  const { t } = useTranslation("home");

  const features = [
    { key: "m1", icon: IconDatabaseImport },
    { key: "m2", icon: IconAdjustmentsHorizontal },
    { key: "m3", icon: IconChartHistogram },
    { key: "m4", icon: IconFlask },
    { key: "m5", icon: IconChartPie },
    { key: "m6", icon: IconFileAnalytics },
  ];

  const stats = [
    { value: "6", key: "modules" },
    { value: "20+", key: "tests" },
    { value: "30+", key: "charts" },
    { value: "8", key: "exports" },
  ];

  const steps = [
    { key: "step1", icon: IconUpload },
    { key: "step2", icon: IconChartDots },
    { key: "step3", icon: IconShare },
  ];

  const {user}=useAuthContext();
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img
              src="/assets/brand/logo.png"
              alt="qu2data"
              className="h-9 object-contain"
            />
            <span className="hidden sm:block text-sm font-bold tracking-tight">
              DataSense&nbsp;Pro
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-[#548828] transition-colors">
              {t("nav.features")}
            </a>
            <a href="#how" className="hover:text-[#548828] transition-colors">
              {t("nav.how")}
            </a>
          </nav>
          {user?(
          <Link
            href={`${user?.Role?.roleName}/dashboard`}
            className="rounded-full bg-[#84BF43] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#84BF43]/30 hover:bg-[#6ca435] hover:shadow-lg hover:shadow-[#84BF43]/40 transition-all"
          >
            {t("nav.dashboard")}
          </Link>  
          ):(
          <Link
            href="/auth"
            className="rounded-full bg-[#84BF43] px-5 py-2 text-sm font-semibold text-white shadow-md shadow-[#84BF43]/30 hover:bg-[#6ca435] hover:shadow-lg hover:shadow-[#84BF43]/40 transition-all"
          >
            {t("nav.login")}
          </Link>)}
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#84BF43]/10 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-40 h-96 w-96 rounded-full bg-[#84BF43]/10 blur-3xl" />
        <div className="container relative grid lg:grid-cols-2 gap-12 items-center py-16 lg:py-24">
          <div>
            <span className="inline-block rounded-full bg-[#f3fadf] px-4 py-1.5 text-xs font-semibold text-[#548828] mb-6">
              {t("hero.badge")}
            </span>
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              {t("hero.title_1")}{" "}
              <span className="relative inline-block">
                <span className="relative z-10">{t("hero.title_highlight")}</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-[#84BF43]/40 rounded-sm -z-0" />
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-500 leading-relaxed max-w-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-[#84BF43] px-7 py-3 font-semibold text-white shadow-lg shadow-[#84BF43]/30 hover:bg-[#6ca435] hover:shadow-xl hover:shadow-[#84BF43]/40 hover:-translate-y-0.5 transition-all"
              >
                {t("hero.cta_start")}
                <IconArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-7 py-3 font-semibold text-gray-700 hover:border-[#84BF43] hover:text-[#548828] transition-colors"
              >
                {t("hero.cta_discover")}
              </a>
            </div>
          </div>

          <DashboardMockup
            kpis={[
              { label: t("hero.kpi_satisfaction"), value: "87%", up: true },
              { label: t("hero.kpi_nps"), value: "+42", up: true },
              { label: t("hero.kpi_responses"), value: "1 208", up: false },
            ]}
          />
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────────────────────── */}
      <section className="bg-gray-900">
        <div className="container grid grid-cols-2 md:grid-cols-4 gap-6 py-10">
          {stats.map(({ value, key }) => (
            <div key={key} className="text-center">
              <p className="text-3xl font-extrabold text-[#9fd64d]">{value}</p>
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400 mt-1">
                {t(`stats.${key}`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features (modules M1–M6) ────────────────────────────────────── */}
      <section id="features" className="container py-16 lg:py-24">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight">
            {t("features.title")}
          </h2>
          <p className="mt-3 text-gray-500">{t("features.subtitle")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ key, icon: Icon }) => (
            <div key={key} className={`${CARD} p-7`}>
              <div className="h-12 w-12 rounded-xl bg-[#f3fadf] flex items-center justify-center mb-5">
                <Icon size={24} className="text-[#548828]" />
              </div>
              <h3 className="font-semibold">{t(`features.${key}_title`)}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {t(`features.${key}_desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section id="how" className="bg-gradient-to-b from-[#f8fbf0] to-white">
        <div className="container py-16 lg:py-20">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <h2 className="text-3xl font-extrabold tracking-tight">
              {t("how.title")}
            </h2>
            <p className="mt-3 text-gray-500">{t("how.subtitle")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ key, icon: Icon }, i) => (
              <div
                key={key}
                className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-7 pt-9"
              >
                <span className="absolute -top-4 left-7 h-8 w-8 rounded-full bg-[#84BF43] text-white flex items-center justify-center text-sm font-bold shadow-md shadow-[#84BF43]/30">
                  {i + 1}
                </span>
                <div className="flex items-center gap-3">
                  <Icon size={22} className="text-[#548828]" />
                  <h3 className="font-semibold">{t(`how.${key}_title`)}</h3>
                </div>
                <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                  {t(`how.${key}_desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────── */}
      <section className="container py-16 lg:py-24">
        <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-8 py-14 text-center text-white shadow-2xl">
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#84BF43]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#84BF43]/20 blur-3xl" />
          <h2 className="relative text-3xl font-extrabold tracking-tight">
            {t("cta.title")}
          </h2>
          <p className="relative mt-3 text-gray-300 max-w-xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <Link
            href="/auth"
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-[#84BF43] px-8 py-3 font-semibold text-white shadow-lg shadow-[#84BF43]/30 hover:bg-[#9fd64d] hover:text-gray-900 transition-all"
          >
            {t("cta.button")}
            <IconArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 py-8">
          <div className="flex items-center gap-3">
            <img
              src="/assets/brand/logo.png"
              alt="qu2data"
              className="h-8 object-contain"
            />
            <p className="text-xs text-gray-400 max-w-xs">{t("footer.tagline")}</p>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} qu2data — DataSense Pro. {t("footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
}

export const getStaticProps = withTranslations(undefined, ["home"]);
