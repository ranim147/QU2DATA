import { IconDatabaseExport, IconWand } from "@tabler/icons-react";
import { IconFolder,IconChartBar, IconGauge, IconBook2 } from "@tabler/icons-react";
import RoleManagementIcon from "./icons/roleManagementIcon";
import UserManagementIcon from "./icons/userManagementsIcon";
import { User } from "../../../types/user.type";

const Links = [
  {
    slug: "users",
    path: "/users",
    icon: <UserManagementIcon />,
  },
  {
    slug: "roles",
    path: "/roles",
    icon: <RoleManagementIcon />,
  },
  {
    slug: "projects",
    path: "/projects",
    icon: <IconFolder />,
  },
  {
    slug: "data-quality",
    path: "/data-quality",
    icon: <IconGauge />,
  },
  {
    slug: "dictionary",
    path: "/dictionary",
    icon: <IconBook2 />,
  },
   {
    slug :"transformations",
    path: "/transformations",
    icon: <IconWand />,
  },
  {
    slug :"sampling",
    path: "/sampling",
    icon: <IconDatabaseExport />,
  },
  {
  slug: "studio",
  path: "/studio",
  icon: <IconChartBar />, 
},
];


function hasPermission(slug: string, access_type: string, user: User) {
  return user?.Role?.accesses?.some(
    (p) =>
      (p.Permission.flag === slug && p[access_type] === true) ||
      (p.Permission.flag === slug && p.isFullAccess)
  );
}
export { Links, hasPermission };
