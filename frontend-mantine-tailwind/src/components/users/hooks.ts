import { useQuery } from "@apollo/client";
import { GetUsersData } from "./types";
import { QUERY_GET_USERS } from "./queries";
import { PaginationOptions } from "../../layout/types";

export function useUsers(search: string, paginationOptions: PaginationOptions) {
  console.log("search value", search);
  const { loading, error, data, refetch } = useQuery<GetUsersData>(
    QUERY_GET_USERS,
    {
      variables: {
        limit: paginationOptions?.limit,
        page: paginationOptions?.page,
        filter: {
          user_name: "%" + search + "%",
          email: "%" + search + "%",
        },
      },
    }
  );

  return {
    refetch,
    loading,
    error,
    users: data ? data.getUsers.rows : [], // Return an empty array if data is not yet fetched
    data_count: data ? data.getUsers.count : 0,
  };
}
