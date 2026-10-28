import { useQuery } from "@apollo/client";
import RoleCard from "../../src/components/roles/roleCard";
import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import DashboardLayout from "../../src/layout/dashboardLayout";
import { GetRolesData } from "../../src/components/roles/types";
import { QUERY_GET_ROLES } from "../../src/components/roles/queries";
import { useEffect, useState } from "react";
import { Role } from "../../src/types/role.types";
import { useStatics } from "../../src/components/roles/hooks";
import Accesses from "../../src/components/accesses";
import { PageHeader } from "../../src/ui";

export default function RolePage() {
  const { loading, data, refetch } = useQuery<GetRolesData>(QUERY_GET_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const { statisticsData, loadingStatistics, refetchStatistics } = useStatics(
    selectedRole?.id
  );

  useEffect(() => {
    if (data?.getRoles?.length > 0) setSelectedRole(data.getRoles[0]);
  }, [data]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Configure role-based access control"
      />

      <div className="flex gap-6 items-start">
        {/* Left panel: role selector + stats */}
        <div className="w-64 flex-shrink-0">
          {selectedRole && (
            <RoleCard
              data={data.getRoles}
              loading={loading}
              selectedRole={selectedRole}
              setSelectedRole={setSelectedRole}
              loadingStatistics={loadingStatistics}
              statisticsData={statisticsData}
              refetchRoles={refetch}
            />
          )}
        </div>

        {/* Right panel: permissions table */}
        <div className="flex-1 min-w-0">
          <Accesses
            selectedRole={statisticsData?.role}
            loading={loading}
            refetchStatistics={refetchStatistics}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getStaticProps = withTranslations(undefined, [
  "sidebar",
  "rolesManagements",
  "common",
]);
