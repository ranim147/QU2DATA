import { Button, LoadingOverlay, Select } from "@mantine/core";
import { Permission } from "../../types/permission.types";
import { useState } from "react";
import { useTranslation } from "next-i18next";
interface Props {
  data: Permission[];
  loading: boolean;
  cancel: () => void;
  save: (id: string) => void;
}
export default function AffectPermission(props: Props) {
  const { data, loading, cancel, save } = props;
  const [selectedPermission, setSelectedPermission] = useState(data[0]?.id);
  const { t } = useTranslation("roleManagements");
  return loading ? (
    <LoadingOverlay visible />
  ) : (
    <div className="flex flex-row justify-start space-x-6 mb-4">
      <Select
        className="w-3/4"
        withAsterisk
        data={data.map((d) => ({
          value: d.id,
          label: d.name,
        }))}
        value={selectedPermission}
        onChange={setSelectedPermission}
      />
      <Button
        color="blue"
        type="submit"
        onClick={() => save(selectedPermission)}
      >
        {t("common:save")}
      </Button>
      <Button color="red" type="submit" onClick={cancel}>
        {t("common:cancel")}
      </Button>
    </div>
  );
}
