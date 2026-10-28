import { useRef, useState } from "react";
import { useTranslation } from "next-i18next";
import { Button, Text } from "@mantine/core";
import { IconUpload, IconCheck, IconX } from "@tabler/icons-react";
import { uploadFileDebug as uploadFile } from "./uploadService.debug";
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_LABEL, UploadedFile } from "./types";

interface Props {
  projectId: string;
  // Appelé après un upload réussi, pour que la page parente
  // puisse rafraîchir sa liste de fichiers ou naviguer ailleurs
  onUploaded?: (file: UploadedFile) => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export default function FileUploadZone({ projectId, onUploaded }: Props) {
  const { t } = useTranslation("files");
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleFile(file: File) {
    setState("uploading");
    setErrorMessage("");

    try {
      const result = await uploadFile(file, projectId);

      if (!result.success || !result.file) {
        setState("error");
        setErrorMessage(result.message || t("upload_error"));
        return;
      }

      setState("success");
      onUploaded?.(result.file);
    } catch (error) {
      setState("error");
      setErrorMessage(t("upload_error"));
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Réinitialise l'input pour pouvoir re-sélectionner le même fichier plus tard
    e.target.value = "";
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDraggingOver
            ? "border-[#84BF43] bg-[#f3fadf]"
            : "border-gray-300 bg-gray-50/60"
        }`}
      >
        {state === "uploading" ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#84BF43] border-t-transparent" />
            </div>
            <p className="font-bold text-gray-900">{t("uploading")}</p>
          </>
        ) : state === "success" ? (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3fadf]">
              <IconCheck size={26} className="text-[#548828]" />
            </div>
            <p className="font-bold text-gray-900">{t("upload_success")}</p>
            <Button
              variant="subtle"
              size="xs"
              mt="sm"
              onClick={() => setState("idle")}
            >
              {t("upload_another")}
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3fadf]">
              <IconUpload size={24} className="text-[#548828]" />
            </div>
            <p className="text-lg font-bold text-gray-900">
              {t("drop_zone_title")}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {t("drop_zone_subtitle", { size: MAX_FILE_SIZE_LABEL })}
            </p>

            <Button
              color="brand"
              mt="md"
              leftIcon={<IconUpload size={16} />}
              onClick={() => inputRef.current?.click()}
            >
              {t("select_file_button")}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(",")}
              className="hidden"
              onChange={handleInputChange}
            />

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {ACCEPTED_EXTENSIONS.map((ext) => (
                <span
                  key={ext}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-500"
                >
                  {ext}
                </span>
              ))}
            </div>
          </>
        )}

        {state === "error" && (
          <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <IconX size={16} />
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}