import { useState } from "react";
import { useMutation } from "@apollo/client";
import { Select, SegmentedControl, NumberInput, Group, Stack } from "@mantine/core";
import { Page } from "../../types/page.types";
import { FORMAT_OPTIONS, PAPER_FORMATS } from "./formatOptions";
import { UPDATE_PAGE_MUTATION, UpdatePageType, UpdatePageVariables } from "./mutation";

interface Props {
  page: Page;
}

export default function PageFormatSelector({ page }: Props) {
  const [updatePage] = useMutation<UpdatePageType, UpdatePageVariables>(
    UPDATE_PAGE_MUTATION
  );

  // Orientation is derived from current width/height for paper formats
  const isLandscape = page.width > page.height;
  const isPaperFormat = PAPER_FORMATS.includes(page.format);
  const isCustom = page.format === "CUSTOM";

  const [customWidth, setCustomWidth] = useState(page.width);
  const [customHeight, setCustomHeight] = useState(page.height);

  function handleFormatChange(format: string | null) {
    if (!format) return;
    updatePage({ variables: { pageId: page.id, format } });
  }

  function handleOrientationChange(value: string) {
    // Swap width/height by sending CUSTOM with inverted dimensions,
    // since backend PAGE_FORMAT_DIMENSIONS only stores portrait values
    const shouldBeLandscape = value === "landscape";
    const currentIsLandscape = page.width > page.height;
    if (shouldBeLandscape === currentIsLandscape) return;

    updatePage({
      variables: {
        pageId: page.id,
        format: "CUSTOM",
        width: page.height,
        height: page.width,
      },
    });
  }

  function handleCustomBlur() {
    if (customWidth === page.width && customHeight === page.height) return;
    updatePage({
      variables: {
        pageId: page.id,
        format: "CUSTOM",
        width: customWidth,
        height: customHeight,
      },
    });
  }

  return (
    <Stack spacing="xs">
      <Select
        label="Format de page"
        data={FORMAT_OPTIONS}
        value={page.format}
        onChange={handleFormatChange}
        size="sm"
      />

      {isPaperFormat && (
        <SegmentedControl
          value={isLandscape ? "landscape" : "portrait"}
          onChange={handleOrientationChange}
          data={[
            { label: "Portrait", value: "portrait" },
            { label: "Paysage", value: "landscape" },
          ]}
          size="xs"
        />
      )}

      {isCustom && (
        <Group spacing="xs">
          <NumberInput
            label="Largeur (px)"
            value={customWidth}
            onChange={(v) => setCustomWidth(Number(v) || 0)}
            onBlur={handleCustomBlur}
            size="xs"
            style={{ width: 120 }}
          />
          <NumberInput
            label="Hauteur (px)"
            value={customHeight}
            onChange={(v) => setCustomHeight(Number(v) || 0)}
            onBlur={handleCustomBlur}
            size="xs"
            style={{ width: 120 }}
          />
        </Group>
      )}
    </Stack>
  );
}