export const publicRoutes = [
  {
    name: "Home",
    route: "/",
  },
  {
    name: "Auth",
    route: "/auth/",
  },
  {
    name: "validation",
    route: "/validation/email",
  },
  {
    name: "resetPassword",
    route: "/resetPassword/",
  },
];

export function isApublicRoute(pathname: string): Boolean {
  const listRoutes = publicRoutes.map((r) => r.route);

  if (listRoutes.includes(pathname)) {
    return true;
  } else {
    for (let i = 0; i < listRoutes.length; i++) {
      if (pathname.includes(listRoutes[i]) && listRoutes[i] !== "/")
        return true;
    }
  }
  return false;
}
