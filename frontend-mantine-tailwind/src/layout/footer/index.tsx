import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { useContext, useState } from "react";
import config from "../../../config";

export default function Footer() {
  const user = null; //use auth later
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  // const [update, { loading }] = useMutation(UPDATE_LANGUAGE);
  const router = useRouter();
  const Languages = [
    { value: "en", label: "EN" },
    { value: "fr", label: "FR" },
  ];

  const handleChange = (e) => {
    const language_selected = e.target.value;
    if (user == null) {
      setLanguage(language_selected);
      //user is offline
      router.push(router.pathname, router.asPath, {
        locale: language_selected,
      });
      i18n.changeLanguage(language_selected);
    }
  };

  return (
    <footer className="absolute bottom-0 inset-x-0 text-center py-5 w-full ">
      <div className="container mx-auto flex justify-between items-center">
        <span>&copy; 2024 {config.appName}</span>
        <select
          value={language}
          onChange={handleChange}
          className="bg-gray-50 border w-36  border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block  p-2.5 focus:outline-none  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 appearance-none "
        >
          {Languages.map((l, key) => (
            <option key={key} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </footer>
  );
}
