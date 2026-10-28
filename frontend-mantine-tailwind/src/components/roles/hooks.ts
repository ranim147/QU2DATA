import { useQuery } from "@apollo/client";
import { QUERY_GET_ROLE_STATISTICS } from "./queries";
import { GET_ROLE_STATISTICS } from "./types";

export function useStatics(id: string) {
  const { data, loading, refetch } = useQuery<GET_ROLE_STATISTICS>(
    QUERY_GET_ROLE_STATISTICS,
    {
      variables: {
        roleId: id,
      },
    }
  );
  return {
    statisticsData: data ? data.getStatics : null,
    loadingStatistics: loading,
    refetchStatistics: refetch,
  };
}
