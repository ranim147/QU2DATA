import { NextRequest, NextResponse } from "next/server";
import { initializeApollo } from "./src/lib/apollo-client";
import { Me } from "./src/helpers/query/me";
import { isApublicRoute } from "./routesRules/publicRoutes";
const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // On ignore certains chemins (Next.js, API, fichiers publics)
  if (
    pathname.startsWith("/_next") ||
    pathname.includes("/api/") ||
    PUBLIC_FILE.test(pathname) ||
    pathname.includes("/unavailable")
  ) {
    return NextResponse.next();
  }

  const userToken = req.cookies.get("quDataSenseToken")?.value;
  const localeCookie = req.cookies.get("NEXT_LOCALE")?.value;

  // Si pas de token (pas connecté)
  if (!userToken) {
    // Si la route n'est pas publique, on redirige vers login selon la locale cookie ou "en"
    const locale = localeCookie ?? "en";
    if (!isApublicRoute(pathname)) {
      return NextResponse.redirect(new URL(`/${locale}/auth/`, req.url));
    }
    return NextResponse.next();
  }

  // Token présent, on récupère l'utilisateur pour avoir ses infos (dont langue)
  try {
    const client = initializeApollo(null, userToken);
    const { data } = await client.query({ query: Me });
    const user = data?.Me;

    if (!user) {
      // Pas d'utilisateur trouvé, logout ou redirection
      return NextResponse.redirect(new URL(`/en/auth/`, req.url));
    }

    const userLang = user.language ?? "en"; // Récupérer la langue user (à adapter si différent)
    const isActive = user.isActive;
    const isBanned = user.isBanned;
    const role = user.Role?.roleName
    if (pathname.includes(`auth`)) {
      if (role === "admin") {
        return NextResponse.redirect(new URL(`/${userLang}/admin/users/`, req.url));
      } else {
        return NextResponse.redirect(new URL(`/${userLang}/${role}/dashboard`, req.url));
      }
    }


    // Met à jour le cookie NEXT_LOCALE si absent ou différent
    if (localeCookie !== userLang) {
      const response = NextResponse.next();
      response.cookies.set("NEXT_LOCALE", userLang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
      return response;
    }

    // Gestion des redirections selon statut
    if (isBanned && pathname !== `/${userLang}/banned`) {
      return NextResponse.redirect(new URL(`/${userLang}/banned/`, req.url));
    }

    if (!isActive && !pathname.includes("validation")) {
      return NextResponse.redirect(new URL(`/${userLang}/validation/`, req.url));
    }

    if (isActive && pathname.includes("/validation")) {
      const home = role === "admin" ? `/${userLang}/admin/users/` : `/${userLang}/${role}/dashboard`;
      return NextResponse.redirect(new URL(home, req.url));
    }

    if (pathname === `/${userLang}/auth/`) {
      const home = role === "admin" ? `/${userLang}/admin/users/` : `/${userLang}/${role}/dashboard`;
      return NextResponse.redirect(new URL(home, req.url));
    }

    if (!isBanned && pathname.includes("/banned")) {
      return NextResponse.redirect(new URL(`/${userLang}/auth/`, req.url));
    }

    if (!isApublicRoute(pathname)) {
      // Forcer le rôle dans l'URL, si différent, on redirige
      if (pathname.split("/")[1] !== role && pathname !== "/" && !pathname.includes("/validation")) {
        const home = role === "admin" ? `/${userLang}/admin/users/` : `/${userLang}/${role}/dashboard`;
        return NextResponse.redirect(new URL(home, req.url));
      }
    }

    // Sinon, on continue normalement
    return NextResponse.next();

  } catch (error) {
    console.error("Error in middleware:", error);

    // Gérer les erreurs spécifiques (ex: utilisateur désactivé)
    const locale = localeCookie ?? "en";

    if (
      error.graphQLErrors &&
      error.graphQLErrors[0]?.extensions?.code === "USER_DISABLED" &&
      pathname !== `/${locale}/banned/`
    ) {
      return NextResponse.redirect(new URL(`/${locale}/banned/`, req.url));
    }
    if (
      error.graphQLErrors &&
      error.graphQLErrors[0]?.extensions?.code ===
      "CONSTRUCTION_MODE_ACCESS_RESTRICTED"
    ) {
      return NextResponse.redirect(new URL(`/${locale}/unavailable/`, req.url));
    }
    if (error.message === "fetch failed") {
      return NextResponse.redirect(new URL(`/${locale}/unavailable`, req.url));
    }

    // En cas d'erreur inconnue, on laisse passer pour éviter de bloquer le site
    return NextResponse.next();
  }
}
export const config = {
  runtime: "nodejs",
  unstable_allowDynamic: [
    "/node_modules/lodash/**", // use a glob to allow anything in the function-bind 3rd party module
  ],
};
