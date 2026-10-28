import DashboardLayout from "../../src/layout/dashboardLayout";
import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import { useTranslation } from "next-i18next";
import { IconUsers, IconShieldCheck } from "@tabler/icons-react";
import Link from "next/link";

const adminCards = [
  {
    href: "/admin/users",
    icon: IconUsers,
    titleKey: "users_title",
    descKey: "users_desc",
  },
  {
    href: "/admin/roles",
    icon: IconShieldCheck,
    titleKey: "roles_title",
    descKey: "roles_desc",
  },
];

export default function AdminPanel() {
  const { t } = useTranslation("adminPanel");

  return (
    <DashboardLayout>
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#84BF43] mb-1">
          Administration
        </p>
        <h1 className="text-3xl font-bold text-gray-900">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
        {adminCards.map(({ href, icon: Icon, titleKey, descKey }) => (
          <Link key={href} href={href}>
            <div className="group p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-[#84BF43]/40 hover:shadow-lg hover:shadow-gray-200/70 transition-all cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-[#f3fadf] flex items-center justify-center mb-4 group-hover:bg-[#84BF43] transition-colors">
                <Icon
                  size={20}
                  className="text-[#548828] group-hover:text-white transition-colors"
                />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {t(titleKey)}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {t(descKey)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "adminPanel",
]);
