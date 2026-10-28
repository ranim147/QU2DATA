import { useMutation } from "@apollo/client";
import { useTranslation } from "next-i18next";
import {
  Table,
  TextInput,
  NumberInput,
  Select,
  ActionIcon,
  LoadingOverlay,
  Text,
  Box,
} from "@mantine/core";
import { IconEye, IconEyeOff, IconTrash } from "@tabler/icons-react";
import { Feature, FeatureScale, FeatureType } from "../../types/feature.types";
import {
  DELETE_FEATURE_MUTATION,
  DeleteFeatureType,
  DeleteFeatureVariables,
  TOGGLE_FEATURE_VISIBILITY_MUTATION,
  ToggleFeatureVisibilityType,
  ToggleFeatureVisibilityVariables,
  UPDATE_FEATURE_MUTATION,
  UpdateFeatureType,
  UpdateFeatureVariables,
} from "./mutation";
import {
  FEATURE_SCALE_OPTIONS,
  FEATURE_TYPE_COLORS,
  FEATURE_TYPE_OPTIONS,
} from "./types";

interface FeatureListProps {
  features: Feature[];
  loading: boolean;
}

export default function FeatureList({ features, loading }: FeatureListProps) {
  const { t } = useTranslation("features");

  const [updateFeature] = useMutation<UpdateFeatureType, UpdateFeatureVariables>(
    UPDATE_FEATURE_MUTATION
  );

  const [toggleVisibility] = useMutation<
    ToggleFeatureVisibilityType,
    ToggleFeatureVisibilityVariables
  >(TOGGLE_FEATURE_VISIBILITY_MUTATION);

  const [deleteFeature] = useMutation<DeleteFeatureType, DeleteFeatureVariables>(
    DELETE_FEATURE_MUTATION,
    {
      update(cache, { data }, { variables }) {
        if (data?.deleteFeature.success && variables?.featureId) {
          cache.evict({
            id: cache.identify({ __typename: "Feature", id: variables.featureId }),
          });
          cache.gc();
        }
      },
    }
  );

  function handleLabelBlur(feature: Feature, value: string) {
    if (value === (feature.label ?? "")) return;
    updateFeature({ variables: { featureId: feature.id, label: value } });
  }

  function handleWeightBlur(feature: Feature, value: string) {
    const parsed = parseFloat(value);
    if (Number.isNaN(parsed) || parsed === feature.weight) return;
    updateFeature({ variables: { featureId: feature.id, weight: parsed } });
  }

  function handleTypeChange(feature: Feature, value: string | null) {
    if (!value) return;
    updateFeature({
      variables: { featureId: feature.id, type: value as FeatureType },
    });
  }

  function handleScaleChange(feature: Feature, value: string | null) {
    if (!value) return;
    updateFeature({
      variables: { featureId: feature.id, scale: value as FeatureScale },
    });
  }

  function handleToggleVisibility(feature: Feature) {
    toggleVisibility({
      variables: { featureId: feature.id },
      optimisticResponse: {
        toggleFeatureVisibility: {
          success: true,
          message: "",
          feature: { ...feature, isVisible: !feature.isVisible },
        },
      },
    });
  }

  function handleDelete(feature: Feature) {
    if (!window.confirm(t("delete_confirm", { name: feature.name }))) return;
    deleteFeature({ variables: { featureId: feature.id } });
  }

  if (loading) {
    return (
      <Box sx={{ position: "relative", minHeight: 200 }}>
        <LoadingOverlay visible />
      </Box>
    );
  }

  if (features.length === 0) {
    return (
      <Text color="dimmed" size="sm" align="center" py="xl">
        {t("list_empty")}
      </Text>
    );
  }

  return (
    <Table verticalSpacing="sm" highlightOnHover>
      <thead>
        <tr>
          <th>{t("col_name")}</th>
          <th>{t("col_label")}</th>
          <th>{t("col_type")}</th>
          <th>{t("col_scale")}</th>
          <th style={{ textAlign: "center" }}>{t("col_visible")}</th>
          <th>{t("col_weight")}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {features.map((feature) => (
          <tr key={feature.id}>
            <td>
              <Text weight={600} size="sm">
                {feature.name}
              </Text>
            </td>

            <td>
              <TextInput
                defaultValue={feature.label ?? ""}
                placeholder="—"
                onBlur={(e) => handleLabelBlur(feature, e.currentTarget.value)}
                variant="unstyled"
                size="sm"
              />
            </td>

            <td>
              <Select
                data={FEATURE_TYPE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: t(opt.labelKey),
                }))}
                value={feature.type}
                onChange={(value) => handleTypeChange(feature, value)}
                size="xs"
                styles={{
                  input: {
                    fontWeight: 600,
                    color: `var(--mantine-color-${FEATURE_TYPE_COLORS[feature.type]}-7)`,
                  },
                }}
              />
            </td>

            <td>
              <Select
                data={FEATURE_SCALE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: t(opt.labelKey),
                }))}
                value={feature.scale ?? undefined}
                placeholder="—"
                onChange={(value) => handleScaleChange(feature, value)}
                size="xs"
              />
            </td>

            <td style={{ textAlign: "center" }}>
              <ActionIcon
                onClick={() => handleToggleVisibility(feature)}
                color={feature.isVisible ? "brand" : "gray"}
                variant="subtle"
                title={
                  feature.isVisible
                    ? t("hide_variable")
                    : t("show_variable")
                }
              >
                {feature.isVisible ? (
                  <IconEye size={18} />
                ) : (
                  <IconEyeOff size={18} />
                )}
              </ActionIcon>
            </td>

            <td>
              <NumberInput
                defaultValue={feature.weight}
                precision={2}
                step={0.1}
                onBlur={(e) =>
                  handleWeightBlur(feature, e.currentTarget.value)
                }
                variant="unstyled"
                size="sm"
                style={{ width: 80 }}
              />
            </td>

            <td>
              <ActionIcon
                onClick={() => handleDelete(feature)}
                color="red"
                variant="subtle"
                title={t("delete_variable")}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}