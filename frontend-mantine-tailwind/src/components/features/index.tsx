import { useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import { useQuery } from "@apollo/client";
import { TextInput, Stack, Text } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import FeatureList from "./list";
import { GET_FEATURES_QUERY, GetFeaturesType, GetFeaturesVariables } from "./query";

interface Props {
  fileId: string;
}

export default function FeatureDictionary({ fileId }: Props) {
  const { t } = useTranslation("features");
  const [search, setSearch] = useState("");

  const { data, loading, error } = useQuery<GetFeaturesType, GetFeaturesVariables>(
    GET_FEATURES_QUERY,
    { variables: { fileId, page: 1, limit: 200 } }
  );

  const rows = data?.getFeatures.rows ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.label ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  if (error) {
    return (
      <Text color="red" size="sm">
        {t("load_error")}
      </Text>
    );
  }

  return (
    <Stack spacing="md">
      <TextInput
        icon={<IconSearch size={16} />}
        placeholder={t("search_placeholder", { count: rows.length })}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        style={{ maxWidth: 360 }}
      />

      <FeatureList features={filtered} loading={loading} />
    </Stack>
  );
}