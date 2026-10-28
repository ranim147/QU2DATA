import { useState } from "react";
import { useTranslation } from "next-i18next";
import LoginForm from "./login/form";
import RegisterForm from "./register/form";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fbf0] to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/assets/brand/logo.png"
            alt="qu2data"
            className="h-12 object-contain"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-300/40 px-8 py-9">
          <p className="text-center text-xs font-semibold text-[#548828] uppercase tracking-widest mb-8">
            DataSense Pro
          </p>
          {mode === "login" ? <LoginForm /> : <RegisterForm />}
          <button
            type="button"
            className="block w-full text-center text-xs text-gray-500 hover:text-[#548828] mt-6 transition-colors"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login"
              ? t("login:go_to_register")
              : t("singUp:go_to_login")}
          </button>
        </div>
      </div>
    </div>
  );
}
