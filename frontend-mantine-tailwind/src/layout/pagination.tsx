import { Pagination, Select } from "@mantine/core";
import { Dispatch, SetStateAction } from "react";
import { PaginationOptions } from "./types";
interface PaginationProps {
  data_count: number;
  paginationOptions: PaginationOptions;
  setPaginationOptions: Dispatch<SetStateAction<PaginationOptions>>;
}
export function PaginationComponent(props: PaginationProps) {
  const { paginationOptions, setPaginationOptions, data_count } = props;
  const limitOptions = ["5", "10", "15", "25", data_count.toString()];
  const handlePageChange = (newPage: number) => {
    setPaginationOptions({
      ...paginationOptions, // Spread the existing paginationOptions
      page: newPage, // Update only the page value
    });
  };
  const handleLimitChange = (limit: number) => {
    setPaginationOptions({
      ...paginationOptions,
      limit: limit,
    });
  };
  const total = Math.ceil(data_count / paginationOptions.limit);
  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
      <Select
        data={limitOptions}
        value={paginationOptions.limit.toString()}
        onChange={(value) => handleLimitChange(Number(value))}
        size="xs"
        radius="md"
        styles={{ input: { width: 70 } }}
      />
      <Pagination
        total={total}
        value={paginationOptions.page}
        onChange={handlePageChange}
        radius="md"
        size="sm"
      />
    </div>
  );
}
