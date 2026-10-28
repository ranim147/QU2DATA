import { useToggle } from "@mantine/hooks";
import { useAuthContext } from "../../../context/AuthContext";
import { useTranslation } from "next-i18next";
import { Links, hasPermission } from "./sidebarLink";
import { useEffect, useState } from "react";
import { LoadingOverlay, Tooltip } from "@mantine/core";
import Link from "next/link";
import { useRouter } from "next/router";
import { useProjectFiles } from "../../../../src/context/ProjectFileContext";

// Ces sections nécessitent qu'un fichier soit sélectionné dans le projet courant
const FILE_DEPENDENT_SLUGS = [
  "transformations",
  "data-quality",
  "dictionary",
  "studio",
  "sampling",
];

/** On a black background the logo needs to be white+green.
 *  Try logo-dark.png first; if absent, fall back to logo.png
 *  with a CSS brightness+invert filter so at least the shape is white. */
function DarkLogo({ className }: { className?: string }) {
  return (
    <img
      src="/assets/brand/logo-dark.png"
      alt="qu2data"
      className={className}
      onError={(e) => {
        const img = e.currentTarget;
        img.src = "/assets/brand/logo.png";
        img.style.filter = "brightness(0) invert(1)";
      }}
    />
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

export default function SideBar() {
  const [open, toggle] = useToggle([true, false]);
  const { t } = useTranslation("sidebar");
  const { user, logout } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const { hasSelectedFile, projectId } = useProjectFiles();
  const router = useRouter();

  useEffect(() => {
    if (user) setLoading(false);
  }, [user]);

  const initial = user?.user_name?.[0]?.toUpperCase() ?? "A";

  // Vrai uniquement sur la page liste exacte (/user/projects), pas sur /user/projects/[id]
  const isOnProjectsListPage =
    router.pathname === `/${user?.Role?.roleName}/projects`;

  const resolveHref = (slug: string, basePath: string) => {
    if (slug === "studio") {
      if (projectId) {
        return `/${user?.Role?.roleName}/studio/${projectId}`;
      }
      return `/${user?.Role?.roleName}/studio`;
    }

    if (slug === "projects") {
      // Un projet est déjà actif -> aller directement à l'upload/liste de fichiers
      // Aucun projet actif (premier usage) -> aller à la liste des projets
      if (projectId) {
        return `/${user?.Role?.roleName}/projects/${projectId}`;
      }
      return `/${user?.Role?.roleName}${basePath}`;
    }

    return `/${user?.Role?.roleName}${basePath}`;
  };

  const resolveLabel = (slug: string) => {
    if (slug === "projects") {
      // Sur la page liste elle-même -> toujours "Projects", peu importe le projectId mémorisé
      if (isOnProjectsListPage) {
        return t("projects");
      }
      return t(projectId ? "data_source" : "projects");
    }
    return t(`${slug}`);
  };

  const isDisabled = (slug: string) =>
    FILE_DEPENDENT_SLUGS.includes(slug) && !hasSelectedFile;

  const isActive = (slug: string) => {
    // /user/quality/[fileId] doit surligner le lien "data-quality"
    if (slug === "data-quality") {
      return router.pathname.startsWith("/user/quality");
    }
    return router.pathname.startsWith(`/${user?.Role?.roleName}/${slug}`);
  };

  const visibleLinks = Links.filter((el) => {
    if (user?.Role?.roleName !== "admin" && (el.slug === "dictionary" || el.slug === "studio")) return true;
    return hasPermission(el.slug, "can_show", user);
  });

  if (open) {
    return (
      <div
        className="flex flex-col w-64 h-screen bg-black border-r border-neutral-900 flex-shrink-0"
        onMouseLeave={() => toggle()}
      >
        {/* Brand */}
        <div className="flex items-center justify-center h-14 border-b border-neutral-800 px-4">
          <DarkLogo className="h-7 object-contain" />
        </div>

        {/* Navigation */}
        <div className="overflow-y-auto overflow-x-hidden flex-grow">
          <ul className="flex flex-col py-4 space-y-1">
            <li className="px-5">
              <span className="text-xs font-bold tracking-widest text-neutral-600 uppercase">
                Menu
              </span>
            </li>

            {loading ? (
              <LoadingOverlay visible={loading} overlayBlur={2} />
            ) : (
              visibleLinks.map(({ path, icon, slug }, key) => {
                const disabled = isDisabled(slug);
                const active = isActive(slug);

                const content = (
                  <span
                    className={`relative flex items-center h-11 pr-6 transition-colors border-l-4 ${
                      disabled
                        ? "text-neutral-700 border-transparent cursor-not-allowed"
                        : active
                        ? "text-white border-[#84BF43] bg-neutral-900"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-900 border-transparent hover:border-[#84BF43]"
                    }`}
                  >
                    <span className="inline-flex justify-center items-center ml-4">
                      {icon}
                    </span>
                    <span className="ml-2 text-sm tracking-wide truncate">
                      {resolveLabel(slug)}
                    </span>
                  </span>
                );

                return (
                  <li key={key}>
                    {disabled ? (
                      <Tooltip
                        label="Sélectionnez un fichier pour continuer"
                        position="right"
                        withArrow
                      >
                        <div className="focus:outline-none">{content}</div>
                      </Tooltip>
                    ) : (
                      <Link
                        href={resolveHref(slug, path)}
                        className="focus:outline-none block"
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>

        {/* User section */}
        <div className="border-t border-neutral-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-[#84BF43] flex items-center justify-center">
                <span className="text-black text-xs font-bold">{initial}</span>
              </div>
              <span className="text-sm text-white font-medium truncate">
                {user?.user_name || "Admin"}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="flex-shrink-0 ml-2 text-neutral-500 hover:text-white transition-colors"
            >
              <LogoutIcon />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col w-12 h-screen bg-black border-r border-neutral-900 flex-shrink-0"
      onMouseEnter={() => toggle()}
    >
      {/* Navigation icons only — no header, no logo */}
      <div className="overflow-y-auto flex-grow pt-4">
        <ul className="flex flex-col space-y-1">
          {visibleLinks.map(({ icon, slug }, key) => {
            const disabled = isDisabled(slug);
            const active = isActive(slug);
            return (
              <li key={key}>
                <span
                  className={`flex items-center justify-center h-10 transition-colors ${
                    disabled
                      ? "text-neutral-700 cursor-not-allowed"
                      : active
                      ? "text-[#84BF43]"
                      : "text-neutral-600 hover:text-[#84BF43] cursor-pointer"
                  }`}
                >
                  {icon}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User dot */}
      <div className="pb-4 flex justify-center">
        <div className="h-2 w-2 rounded-full bg-[#84BF43]" title={user?.user_name} />
      </div>
    </div>
  );
}