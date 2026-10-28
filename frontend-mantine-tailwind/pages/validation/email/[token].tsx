import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client";
import { useTranslation } from "next-i18next";
import ValidationStepper from "../../../src/components/validationStepper";
import {
  VALIDATE_EMAIL,
  ValidateEmailType,
} from "../../../src/components/validationStepper/mutation";
import { withTranslations } from "../../../src/helpers/HOC/withTranslations";
import { useAuthContext } from "../../../src/context/AuthContext";

interface ValidationResult {
  content: string;
  isError: boolean;
}

export default function ValidateEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const { t } = useTranslation("validation");
  const [validateEmail] = useMutation<ValidateEmailType>(VALIDATE_EMAIL);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    if (!token || typeof token !== "string") return;

    validateEmail({ variables: { token } })
      .then(({ data }) => {
        if (data?.ValidateEmail?.success) {
          setResult({ content: t("validation_with_success"), isError: false });
          setTimeout(() => router.push("/"), 4000);
        } else {
          setResult({ content: t("something_went_wrong"), isError: true });
        }
      })
      .catch(() => {
        setResult({ content: t("something_went_wrong"), isError: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3fadf] via-white to-white flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#84BF43]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#84BF43]/8 blur-3xl" />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo + brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <img
            src="/assets/brand/logo.png"
            alt="qu2data"
            className="h-12 object-contain"
          />
          <span className="text-xs font-bold uppercase tracking-widest text-[#84BF43]">
            DataSense Pro
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl shadow-gray-300/40 px-10 py-12">
          {result ? (
            <ValidationStepper
              active={2}
              content={result.content}
              isError={result.isError}
            />
          ) : (
            /* Loading state */
            <div className="flex flex-col items-center gap-6 py-16">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-[#84BF43]/20" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#84BF43] animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">{t("verifying_title")}</p>
                <p className="text-sm text-gray-400 mt-1">{t("verifying_desc")}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          © {new Date().getFullYear()} qu2data · DataSense Pro
        </p>
      </div>
    </div>
  );
}

export const getServerSideProps = withTranslations(undefined, ["validation"]);
