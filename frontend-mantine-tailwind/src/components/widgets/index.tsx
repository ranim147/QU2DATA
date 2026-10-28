import { useEffect, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  ColorInput,
  Divider,
  Drawer,
  Group,
  LoadingOverlay,
  Modal,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import { IconEdit, IconPalette, IconPlus, IconSettings, IconTrash, IconTypography } from "@tabler/icons-react";
import ConfirmComponent from "../../layout/confirmComponent";
import styles from "./widgets.module.scss";
import {
  CREATE_WIDGET,
  CreateWidgetData,
  CreateWidgetVariables,
  DELETE_WIDGET,
  DeleteWidgetData,
  DeleteWidgetVariables,
  UPDATE_WIDGET,
  UpdateWidgetData,
  UpdateWidgetVariables,
} from "./mutation";
import {
  GET_WIDGETS,
  GET_WIDGET_TYPES,
  GetWidgetsData,
  GetWidgetsVariables,
  GetWidgetTypesData,
} from "./query";
import { TextWidgetAlignment, TextWidgetVariant, Widget } from "./types";
import { Page } from "../../types/page.types";
import { CREATE_PAGE_MUTATION, CreatePageType, CreatePageVariables } from "../pages/mutation";
import { GET_PAGES_QUERY } from "../pages/query";
import {
  compactWidgetLayout,
  findAvailableWidgetPosition,
  isWidgetPositionValid,
  WIDGET_LAYOUT,
  widgetHeight,
  widgetLeft,
  widgetTop,
  widgetWidth,
} from "./layout";

interface Props {
  page: Page;
  pages: Page[];
  projectId: string;
  onSelectPage: (pageId: string) => void;
}

interface FormState {
  text: string;
  subtitle: string;
  variant: TextWidgetVariant;
  alignment: TextWidgetAlignment;
  x: number;
  y: number;
  w: number;
  h: number;
}

const EMPTY_FORM: FormState = {
  text: "",
  subtitle: "",
  variant: "PARAGRAPH",
  alignment: "LEFT",
  x: 0,
  y: 0,
  w: 4,
  h: 2,
};

const PALETTES = [
  { name: "DataSense", colors: ["#84BF43", "#111827", "#F4FAEA"] },
  { name: "Océan", colors: ["#2563EB", "#0F2744", "#EFF6FF"] },
  { name: "Forêt", colors: ["#10B981", "#064E3B", "#ECFDF5"] },
  { name: "Soleil", colors: ["#F59E0B", "#78350F", "#FFFBEB"] },
  { name: "Vibrant", colors: ["#EC4899", "#4C1D95", "#FDF2F8"] },
  { name: "Mono", colors: ["#6B7280", "#111827", "#F3F4F6"] },
];

export default function Widgets({ page, pages, projectId, onSelectPage }: Props) {
  const apolloClient = useApolloClient();
  const pageId = page.id;
  const [opened, setOpened] = useState(false);
  const [editing, setEditing] = useState<Widget | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [widgetToDelete, setWidgetToDelete] = useState<Widget | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dimensionError, setDimensionError] = useState<string | null>(null);
  const [organizing, setOrganizing] = useState(false);

  const widgetsQuery = useQuery<GetWidgetsData, GetWidgetsVariables>(GET_WIDGETS, {
    variables: { pageId },
  });
  const typesQuery = useQuery<GetWidgetTypesData>(GET_WIDGET_TYPES);
  const [createWidget, createState] = useMutation<CreateWidgetData, CreateWidgetVariables>(
    CREATE_WIDGET
  );
  const [updateWidget, updateState] = useMutation<UpdateWidgetData, UpdateWidgetVariables>(
    UPDATE_WIDGET
  );
  const [deleteWidget, deleteState] = useMutation<DeleteWidgetData, DeleteWidgetVariables>(
    DELETE_WIDGET
  );
  const [createPage] = useMutation<CreatePageType, CreatePageVariables>(CREATE_PAGE_MUTATION);

  const widgets = widgetsQuery.data?.widgets ?? [];
  const textType = typesQuery.data?.widgetTypes.find((type) => type.name === "TEXT");
  const saving = createState.loading || updateState.loading;
  const selectedWidget = widgets.find((widget) => widget.id === selectedId) ?? null;

  useEffect(() => {
    if (widgetsQuery.loading || organizing || widgets.length < 2) return;
    const compacted = compactWidgetLayout(page, widgets);
    const needsOrganization = compacted.some((widget) => {
      const original = widgets.find((item) => item.id === widget.id);
      return Boolean(
        original &&
          (original.x !== widget.x ||
            original.y !== widget.y ||
            original.w !== widget.w ||
            original.h !== widget.h)
      );
    });
    if (needsOrganization) void persistLayout(compacted);
  }, [widgetsQuery.data?.widgets, page.id, page.width, page.height]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, y: widgets.length * 2 });
    setFormError(null);
    setOpened(true);
  }

  function openEdit(widget: Widget) {
    setEditing(widget);
    setForm({
      text: widget.value.text,
      subtitle: widget.value.subtitle ?? "",
      variant: widget.value.variant,
      alignment: widget.value.alignment,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
    });
    setFormError(null);
    setOpened(true);
  }

  async function save() {
    if (!form.text.trim()) {
      setFormError("Le texte est obligatoire.");
      return;
    }

    const normalizedWidth = Math.min(Math.max(form.w, 1), WIDGET_LAYOUT.columns);
    const value = {
      text: form.text.trim(),
      subtitle: form.subtitle.trim() || undefined,
      variant: form.variant,
      alignment: form.alignment,
      textColor: editing?.value.textColor ?? "#111827",
      backgroundColor: editing?.value.backgroundColor ?? "#ffffff",
      accentColor: editing?.value.accentColor ?? "#84BF43",
    };

    try {
      if (editing) {
        await updateWidget({
          variables: {
            id: editing.id,
            input: { x: form.x, y: form.y, w: normalizedWidth, h: form.h, value },
          },
        });
      } else {
        if (!textType) {
          setFormError("Le type de widget TEXT est introuvable.");
          return;
        }
        const placement = await resolvePlacement(normalizedWidth, form.h);
        await createWidget({
          variables: {
            input: {
              widgetTypeId: textType.id,
              x: placement.x,
              y: placement.y,
              w: normalizedWidth,
              h: form.h,
              value,
              pageId: placement.pageId,
              chartTypeId: null,
            },
          },
        });
        if (placement.pageId !== pageId) onSelectPage(placement.pageId);
      }
      await widgetsQuery.refetch();
      setOpened(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue.");
    }
  }

  async function getPageWidgets(targetPageId: string): Promise<Widget[]> {
    if (targetPageId === pageId) return widgets;
    const result = await apolloClient.query<GetWidgetsData, GetWidgetsVariables>({
      query: GET_WIDGETS,
      variables: { pageId: targetPageId },
      fetchPolicy: "network-only",
    });
    return result.data.widgets;
  }

  async function resolvePlacement(
    w: number,
    h: number
  ): Promise<{ pageId: string; x: number; y: number }> {
    const currentIndex = pages.findIndex((item) => item.id === pageId);
    const orderedPages = currentIndex >= 0 ? pages.slice(currentIndex) : [page];

    for (const candidatePage of orderedPages) {
      const pageWidgets = await getPageWidgets(candidatePage.id);
      const position = findAvailableWidgetPosition(candidatePage, pageWidgets, w, h);
      if (position) return { pageId: candidatePage.id, ...position };
    }

    const result = await createPage({
      variables: {
        projectId,
        title: `Page ${pages.length + 1}`,
        format: page.format,
        ...(page.format === "CUSTOM" ? { width: page.width, height: page.height } : {}),
      },
      refetchQueries: [{ query: GET_PAGES_QUERY, variables: { projectId } }],
      awaitRefetchQueries: true,
    });
    const nextPage = result.data?.createPage.page;
    if (!nextPage) throw new Error("Impossible de créer la page suivante.");
    const position = findAvailableWidgetPosition(nextPage, [], w, h);
    if (!position) throw new Error("Le widget est trop grand pour ce format de page.");
    return { pageId: nextPage.id, ...position };
  }

  async function confirmDelete() {
    if (!widgetToDelete) return;
    try {
      await deleteWidget({ variables: { id: widgetToDelete.id } });
      await widgetsQuery.refetch();
      if (selectedId === widgetToDelete.id) setSelectedId(null);
      setWidgetToDelete(null);
    } catch (error) {
      setWidgetToDelete(null);
      setFormError(error instanceof Error ? error.message : "Impossible de supprimer le widget.");
    }
  }

  async function updateAppearance(
    changes: Partial<Pick<Widget["value"], "textColor" | "backgroundColor" | "accentColor">>
  ) {
    if (!selectedWidget) return;
    await updateWidget({
      variables: {
        id: selectedWidget.id,
        input: { value: { ...selectedWidget.value, ...changes } },
      },
    });
    await widgetsQuery.refetch();
  }

  async function updateDimension(
    field: "x" | "y" | "w" | "h",
    rawValue: number | ""
  ) {
    if (!selectedWidget || rawValue === "") return;
    const value = Math.trunc(Number(rawValue));
    const minimum = field === "w" || field === "h" ? 1 : 0;
    if (!Number.isFinite(value) || value < minimum) {
      setDimensionError(
        field === "w" || field === "h"
          ? "La largeur et la hauteur doivent être supérieures à zéro."
          : "Les positions X et Y ne peuvent pas être négatives."
      );
      return;
    }

    const placement = { ...selectedWidget, [field]: value };
    if (!isWidgetPositionValid(page, [], { ...placement, x: 0, y: 0 })) {
      setDimensionError(
        "Cette dimension est trop grande pour le format de la page."
      );
      return;
    }

    setDimensionError(null);
    const resizedWidgets = widgets.map((widget) =>
      widget.id === selectedWidget.id ? placement : widget
    );
    await persistLayout(compactWidgetLayout(page, resizedWidgets));
  }

  async function persistLayout(compacted: Widget[]) {
    const changed = compacted.filter((widget, index) => {
      const original = widgets.find((item) => item.id === widget.id);
      return original &&
        (original.x !== widget.x ||
          original.y !== widget.y ||
          original.w !== widget.w ||
          original.h !== widget.h);
    });
    if (changed.length === 0) return;

    setOrganizing(true);
    try {
      await Promise.all(
        changed.map((widget) =>
          updateWidget({
            variables: {
              id: widget.id,
              input: { x: widget.x, y: widget.y, w: widget.w, h: widget.h },
            },
          })
        )
      );
      await widgetsQuery.refetch();
    } finally {
      setOrganizing(false);
    }
  }

  if (widgetsQuery.error || typesQuery.error) {
    return <Alert color="red">Impossible de charger les widgets.</Alert>;
  }

  return (
    <>
      <LoadingOverlay visible={widgetsQuery.loading || typesQuery.loading} />
      <Box className={styles.toolbar}>
        <Group spacing="sm">
          <Box className={styles.toolbarIcon}><IconTypography size={20} /></Box>
          <Box>
            <Group spacing={8}>
              <Text size="sm" weight={700}>Widgets</Text>
              <Badge size="sm" color="green" variant="light">{widgets.length}</Badge>
            </Group>
            <Text size="xs" color="dimmed">Composez le contenu de cette page</Text>
          </Box>
        </Group>
        <Group spacing="sm">
          <Button
            leftIcon={<IconPlus size={16} />}
            size="sm"
            radius="md"
            onClick={openCreate}
            disabled={!textType}
            className={styles.addButton}
          >
            Ajouter un texte
          </Button>
        </Group>
      </Box>

      {!widgetsQuery.loading && widgets.length === 0 && (
        <Box className={styles.emptyState}>
          <IconTypography size={36} stroke={1.3} />
          <Text weight={600} color="dark" mt={8}>Votre page est vide</Text>
          <Text size="xs" color="dimmed">Ajoutez un premier bloc de texte pour commencer.</Text>
        </Box>
      )}

      {widgets.map((widget) => (
        <div
          key={widget.id}
          onMouseEnter={() => setHoveredId(widget.id)}
          onMouseLeave={() => setHoveredId(null)}
          onClick={() => setSelectedId(widget.id)}
          className={`${styles.widgetCard} ${
            widget.value.variant === "TITLE" ? styles.titleCard : ""
          } ${hoveredId === widget.id ? styles.hoveredCard : ""}`}
          style={{
            left: widgetLeft(page, widget.x),
            top: widgetTop(widget.y),
            width: widgetWidth(page, widget.w),
            minHeight: widgetHeight(widget.h),
            textAlign: widget.value.alignment.toLowerCase() as "left" | "center" | "right",
            color: widget.value.textColor ?? "#111827",
            background: widget.value.backgroundColor ?? "#ffffff",
            borderColor:
              selectedId === widget.id
                ? widget.value.accentColor ?? "#84BF43"
                : undefined,
          }}
        >
          <Text className={styles.widgetLabel}>
            {widget.value.variant === "TITLE"
              ? "Titre de page"
              : widget.value.variant === "SUBTITLE"
              ? "Sous-titre"
              : "Bloc de texte"}
          </Text>
          <Text
            size={widget.value.variant === "TITLE" ? 30 : widget.value.variant === "SUBTITLE" ? 21 : "md"}
            weight={widget.value.variant === "PARAGRAPH" ? 400 : 700}
            className={styles.widgetText}
            style={{ color: widget.value.textColor ?? "#111827" }}
          >
            {widget.value.text}
          </Text>
          {widget.value.subtitle && (
            <Text
              size={widget.value.variant === "TITLE" ? "md" : "sm"}
              mt={8}
              className={styles.widgetSubtitle}
              style={{ color: widget.value.textColor ?? "#111827" }}
            >
              {widget.value.subtitle}
            </Text>
          )}
          <Group spacing={6} className={styles.actions}>
            <ActionIcon variant="filled" color="dark" radius="md" onClick={(event) => { event.stopPropagation(); openEdit(widget); }} title="Modifier">
              <IconEdit size={15} />
            </ActionIcon>
            <ActionIcon
              variant="filled"
              color="red"
              radius="md"
              loading={deleteState.loading}
              onClick={(event) => { event.stopPropagation(); setWidgetToDelete(widget); }}
              title="Supprimer"
            >
              <IconTrash size={15} />
            </ActionIcon>
          </Group>
        </div>
      ))}

      <Drawer
        opened={Boolean(selectedWidget)}
        onClose={() => setSelectedId(null)}
        position="right"
        size={360}
        padding="lg"
        title="Inspecteur du widget"
        overlayProps={{ opacity: 0.12, blur: 1 }}
        classNames={{ title: styles.inspectorTitle }}
      >
        {selectedWidget && (
          <Stack spacing="lg">
            <Box>
              <Badge color="green" variant="light">Widget texte</Badge>
              <Text weight={700} size="lg" mt={8} lineClamp={2}>{selectedWidget.value.text}</Text>
            </Box>
            <Tabs defaultValue="appearance">
              <Tabs.List grow>
                <Tabs.Tab value="content" icon={<IconTypography size={15} />}>Contenu</Tabs.Tab>
                <Tabs.Tab value="appearance" icon={<IconPalette size={15} />}>Affichage</Tabs.Tab>
                <Tabs.Tab value="actions" icon={<IconSettings size={15} />}>Actions</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="content" pt="lg">
                <Stack>
                  <TextInput
                    label="Texte principal"
                    value={selectedWidget.value.text}
                    onChange={(event) => {
                      const text = event.currentTarget.value;
                      widgetsQuery.updateQuery((data) => ({
                        ...data,
                        widgets: data.widgets.map((widget) =>
                          widget.id === selectedWidget.id
                            ? { ...widget, value: { ...widget.value, text } }
                            : widget
                        ),
                      }));
                    }}
                    onBlur={(event) => {
                      const text = event.currentTarget.value.trim();
                      if (text) updateWidget({ variables: { id: selectedWidget.id, input: { value: { ...selectedWidget.value, text } } } }).then(() => widgetsQuery.refetch());
                    }}
                  />
                  <TextInput
                    label="Sous-titre"
                    placeholder="Ajoutez un sous-titre optionnel"
                    value={selectedWidget.value.subtitle ?? ""}
                    onChange={(event) => {
                      const subtitle = event.currentTarget.value;
                      widgetsQuery.updateQuery((data) => ({
                        ...data,
                        widgets: data.widgets.map((widget) =>
                          widget.id === selectedWidget.id
                            ? { ...widget, value: { ...widget.value, subtitle } }
                            : widget
                        ),
                      }));
                    }}
                    onBlur={(event) => updateWidget({ variables: { id: selectedWidget.id, input: { value: { ...selectedWidget.value, subtitle: event.currentTarget.value.trim() || undefined } } } }).then(() => widgetsQuery.refetch())}
                  />
                  <Select label="Style" value={selectedWidget.value.variant} data={[{ value: "TITLE", label: "Titre" }, { value: "SUBTITLE", label: "Sous-titre" }, { value: "PARAGRAPH", label: "Paragraphe" }]} onChange={(value) => value && updateWidget({ variables: { id: selectedWidget.id, input: { value: { ...selectedWidget.value, variant: value as TextWidgetVariant } } } }).then(() => widgetsQuery.refetch())} />
                  <Select label="Alignement" value={selectedWidget.value.alignment} data={[{ value: "LEFT", label: "Gauche" }, { value: "CENTER", label: "Centre" }, { value: "RIGHT", label: "Droite" }]} onChange={(value) => value && updateWidget({ variables: { id: selectedWidget.id, input: { value: { ...selectedWidget.value, alignment: value as TextWidgetAlignment } } } }).then(() => widgetsQuery.refetch())} />
                  <Divider my="xs" />
                  <Box>
                    <Text size="xs" weight={700} color="dimmed" transform="uppercase" mb="sm">
                      Dimensions et position
                    </Text>
                    {dimensionError && <Alert color="red" mb="sm">{dimensionError}</Alert>}
                    <SimpleGrid cols={2} spacing="sm">
                      <Box className={styles.dimensionCard}>
                        <NumberInput
                          label="Position X"
                          min={0}
                          precision={0}
                          value={selectedWidget.x}
                          onChange={(value) => updateDimension("x", value)}
                          size="xs"
                        />
                        <Text size="xs" color="dimmed">
                          {Math.round(widgetLeft(page, selectedWidget.x))} px
                        </Text>
                      </Box>
                      <Box className={styles.dimensionCard}>
                        <NumberInput
                          label="Position Y"
                          min={0}
                          precision={0}
                          value={selectedWidget.y}
                          onChange={(value) => updateDimension("y", value)}
                          size="xs"
                        />
                        <Text size="xs" color="dimmed">
                          {Math.round(widgetTop(selectedWidget.y))} px
                        </Text>
                      </Box>
                      <Box className={styles.dimensionCard}>
                        <NumberInput
                          label="Largeur W"
                          min={1}
                          precision={0}
                          value={selectedWidget.w}
                          onChange={(value) => updateDimension("w", value)}
                          size="xs"
                        />
                        <Text size="xs" color="dimmed">
                          {Math.round(widgetWidth(page, selectedWidget.w))} px
                        </Text>
                      </Box>
                      <Box className={styles.dimensionCard}>
                        <NumberInput
                          label="Hauteur H"
                          min={1}
                          precision={0}
                          value={selectedWidget.h}
                          onChange={(value) => updateDimension("h", value)}
                          size="xs"
                        />
                        <Text size="xs" color="dimmed">
                          {Math.round(widgetHeight(selectedWidget.h))} px
                        </Text>
                      </Box>
                    </SimpleGrid>
                    <Box className={styles.pageDimensionSummary} mt="sm">
                      <Group position="apart">
                        <Text size="xs" color="dimmed">Format de page</Text>
                        <Text size="xs" weight={700}>{page.format}</Text>
                      </Group>
                      <Group position="apart" mt={4}>
                        <Text size="xs" color="dimmed">Canvas</Text>
                        <Text size="xs" weight={600}>{page.width} × {page.height} px</Text>
                      </Group>
                      <Group position="apart" mt={4}>
                        <Text size="xs" color="dimmed">Occupation</Text>
                        <Text size="xs" weight={600}>
                          {Math.round((widgetWidth(page, selectedWidget.w) / page.width) * 100)}% × {Math.round((widgetHeight(selectedWidget.h) / page.height) * 100)}%
                        </Text>
                      </Group>
                    </Box>
                  </Box>
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="appearance" pt="lg">
                <Text size="xs" weight={700} color="dimmed" transform="uppercase" mb="sm">Palettes de couleurs</Text>
                <SimpleGrid cols={2} spacing="sm">
                  {PALETTES.map((palette) => (
                    <button
                      key={palette.name}
                      type="button"
                      className={styles.paletteButton}
                      onClick={() => updateAppearance({ accentColor: palette.colors[0], textColor: palette.colors[1], backgroundColor: palette.colors[2] })}
                    >
                      <span className={styles.swatches}>
                        {palette.colors.map((color) => <span key={color} style={{ background: color }} />)}
                      </span>
                      <Text size="xs" weight={600}>{palette.name}</Text>
                    </button>
                  ))}
                </SimpleGrid>
                <Divider my="lg" />
                <Stack>
                  <ColorInput label="Couleur du texte" format="hex" value={selectedWidget.value.textColor ?? "#111827"} onChangeEnd={(color) => updateAppearance({ textColor: color })} />
                  <ColorInput label="Couleur du fond" format="hex" value={selectedWidget.value.backgroundColor ?? "#ffffff"} onChangeEnd={(color) => updateAppearance({ backgroundColor: color })} />
                  <ColorInput label="Couleur d’accent" format="hex" value={selectedWidget.value.accentColor ?? "#84BF43"} onChangeEnd={(color) => updateAppearance({ accentColor: color })} />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="actions" pt="lg">
                <Stack>
                  <Button variant="outline" color="dark" leftIcon={<IconEdit size={16} />} onClick={() => openEdit(selectedWidget)}>Modifier le widget</Button>
                  <Button variant="outline" color="red" leftIcon={<IconTrash size={16} />} onClick={() => setWidgetToDelete(selectedWidget)}>Supprimer le widget</Button>
                </Stack>
              </Tabs.Panel>
            </Tabs>
          </Stack>
        )}
      </Drawer>

      <ConfirmComponent
        opened={Boolean(widgetToDelete)}
        title="Supprimer le widget"
        description={`Voulez-vous vraiment supprimer « ${widgetToDelete?.value.text ?? "ce widget"} » ? Cette action est définitive.`}
        confirmAction={confirmDelete}
        onClose={() => setWidgetToDelete(null)}
      />

      <Modal opened={opened} onClose={() => setOpened(false)} title={editing ? "Modifier le widget" : "Ajouter un widget texte"}>
        <Stack>
          {formError && <Alert color="red">{formError}</Alert>}
          <TextInput label="Texte" required value={form.text} onChange={(event) => setForm({ ...form, text: event.currentTarget.value })} />
          <TextInput label="Sous-titre" placeholder="Optionnel" value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.currentTarget.value })} />
          <Select label="Style" value={form.variant} data={[{ value: "TITLE", label: "Titre" }, { value: "SUBTITLE", label: "Sous-titre" }, { value: "PARAGRAPH", label: "Paragraphe" }]} onChange={(value) => value && setForm({ ...form, variant: value as TextWidgetVariant })} />
          <Select label="Alignement" value={form.alignment} data={[{ value: "LEFT", label: "Gauche" }, { value: "CENTER", label: "Centre" }, { value: "RIGHT", label: "Droite" }]} onChange={(value) => value && setForm({ ...form, alignment: value as TextWidgetAlignment })} />
          <Group grow>
            <NumberInput label="X" min={0} precision={0} value={form.x} onChange={(value) => setForm({ ...form, x: Number(value) || 0 })} />
            <NumberInput label="Y" min={0} precision={0} value={form.y} onChange={(value) => setForm({ ...form, y: Number(value) || 0 })} />
            <NumberInput label="Largeur" min={1} max={WIDGET_LAYOUT.columns} precision={0} value={form.w} onChange={(value) => setForm({ ...form, w: Number(value) || 1 })} />
            <NumberInput label="Hauteur" min={1} precision={0} value={form.h} onChange={(value) => setForm({ ...form, h: Number(value) || 1 })} />
          </Group>
          <Button loading={saving} onClick={save}>{editing ? "Enregistrer" : "Créer"}</Button>
        </Stack>
      </Modal>
    </>
  );
}
