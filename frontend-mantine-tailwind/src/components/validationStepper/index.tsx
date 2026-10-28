import { useState } from "react";
import { useTranslation } from "next-i18next";
import { useMutation } from "@apollo/client";
import {
  SEND_EMAIL_VALIDATION_MUTATION,
  SendEmailValidationType,
} from "./mutation";

interface ValidationProps {
  active?: number;
  content?: string;
  isError?: boolean;
}

function StepDot({ n, current }: { n: number; current: number }) {
  const done = current > n;
  const active = current === n;
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
          done
            ? "bg-[#84BF43] text-white shadow-md shadow-[#84BF43]/40"
            : active
            ? "bg-white border-2 border-[#84BF43] text-[#548828] shadow-md shadow-[#84BF43]/20"
            : "bg-gray-100 border-2 border-gray-200 text-gray-400"
        }`}
      >
        {done ? (
          <svg viewBox="0 0 16 16" className="h-4 w-4 fill-current">
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0z" />
          </svg>
        ) : (
          n
        )}
      </div>
    </div>
  );
}

/* ── Email envelope illustration ── */
function EmailIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[260px]" fill="none">
      {/* Shadow */}
      <ellipse cx="100" cy="132" rx="60" ry="6" fill="#84BF43" opacity="0.12" />
      {/* Envelope body */}
      <rect x="20" y="30" width="160" height="100" rx="10" fill="white" stroke="#e5e7eb" strokeWidth="1.5" />
      {/* Envelope top fold */}
      <path d="M20 40 L100 88 L180 40" stroke="#84BF43" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Left flap */}
      <path d="M20 40 L20 130 L68 85Z" fill="#f3fadf" stroke="#e5e7eb" strokeWidth="1" />
      {/* Right flap */}
      <path d="M180 40 L180 130 L132 85Z" fill="#f3fadf" stroke="#e5e7eb" strokeWidth="1" />
      {/* Bottom fold lines */}
      <path d="M20 130 L68 85 M132 85 L180 130" stroke="#e5e7eb" strokeWidth="1" />
      {/* @ symbol in center */}
      <circle cx="100" cy="72" r="18" fill="#f3fadf" />
      <text x="100" y="78" textAnchor="middle" fontSize="16" fill="#84BF43" fontWeight="bold" fontFamily="monospace">@</text>
      {/* Sparkles */}
      <circle cx="170" cy="20" r="4" fill="#84BF43" opacity="0.7" />
      <circle cx="155" cy="12" r="2.5" fill="#84BF43" opacity="0.4" />
      <circle cx="178" cy="10" r="2" fill="#84BF43" opacity="0.5" />
      <circle cx="30" cy="18" r="3" fill="#84BF43" opacity="0.5" />
      <circle cx="18" cy="10" r="2" fill="#84BF43" opacity="0.3" />
    </svg>
  );
}

/* ── Success illustration ── */
function SuccessIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[200px]" fill="none">
      <ellipse cx="100" cy="130" rx="55" ry="6" fill="#84BF43" opacity="0.15" />
      <circle cx="100" cy="68" r="48" fill="#f3fadf" />
      <circle cx="100" cy="68" r="38" fill="#84BF43" opacity="0.15" />
      <circle cx="100" cy="68" r="30" fill="#84BF43" />
      <path d="M86 68 L95 77 L116 56" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Rays */}
      {[0,45,90,135,180,225,270,315].map((deg, i) => (
        <line
          key={i}
          x1={100 + Math.cos((deg * Math.PI) / 180) * 36}
          y1={68 + Math.sin((deg * Math.PI) / 180) * 36}
          x2={100 + Math.cos((deg * Math.PI) / 180) * 44}
          y2={68 + Math.sin((deg * Math.PI) / 180) * 44}
          stroke="#84BF43"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      ))}
    </svg>
  );
}

/* ── Error illustration ── */
function ErrorIllustration() {
  return (
    <svg viewBox="0 0 200 140" className="w-full max-w-[200px]" fill="none">
      <ellipse cx="100" cy="130" rx="55" ry="6" fill="#ef4444" opacity="0.1" />
      <circle cx="100" cy="68" r="48" fill="#fef2f2" />
      <circle cx="100" cy="68" r="30" fill="#ef4444" />
      <path d="M93 54 L107 82" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="100" cy="88" r="2.5" fill="white" />
    </svg>
  );
}

export default function ValidationStepper(props: ValidationProps) {
  const [active] = useState(props?.active ?? 1);
  const [content, setContent] = useState(props?.content ?? null);
  const [canTryAgain, setCanTryAgain] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { t } = useTranslation("validation");

  const [sendEmailValidationMutation, { loading }] =
    useMutation<SendEmailValidationType>(SEND_EMAIL_VALIDATION_MUTATION);

  function verifyMyEmail() {
    setCanTryAgain(false);
    sendEmailValidationMutation().then(({ data }) => {
      const { SendEmailValidation } = data;
      if (SendEmailValidation.success) {
        setEmailSent(true);
        setContent(t("we_have_sent_you_an_email"));
        setTimeout(() => setCanTryAgain(true), 30000);
      }
    });
  }

  const isError = active === 2 && props.isError;

  return (
    <div className="flex flex-col items-center w-full">

      {/* Step bar */}
      <div className="flex items-center w-full max-w-sm mb-10 px-2">
        <StepDot n={1} current={active} />
        <div className="flex-1 mx-1">
          <div className="h-1 rounded-full overflow-hidden bg-gray-100">
            <div
              className="h-full bg-[#84BF43] rounded-full transition-all duration-500"
              style={{ width: active > 1 ? "100%" : "0%" }}
            />
          </div>
        </div>
        <StepDot n={2} current={active} />
        <div className="flex-1 mx-1">
          <div className="h-1 rounded-full overflow-hidden bg-gray-100">
            <div
              className="h-full bg-[#84BF43] rounded-full transition-all duration-500"
              style={{ width: active > 2 ? "100%" : "0%" }}
            />
          </div>
        </div>
        <StepDot n={3} current={active} />
      </div>

      {/* Step labels */}
      <div className="flex justify-between w-full max-w-sm px-0 mb-10 -mt-6">
        {[t("stepper.firstStep.label"), t("stepper.secondStep.label"), t("stepper.finalStep.label")].map((label, i) => (
          <span
            key={i}
            className={`text-[10px] font-semibold uppercase tracking-wide text-center w-16 leading-tight ${
              active === i + 1 ? "text-[#548828]" : active > i + 1 ? "text-gray-400" : "text-gray-300"
            }`}
          >
            {label}
          </span>
        ))}
      </div>

      {/* ── Step 1 — Send validation email ── */}
      {active === 1 && (
        <div className="flex flex-col items-center text-center w-full">
          <div className="mb-6">
            <EmailIllustration />
          </div>

          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {t("step1_title")}
          </h2>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-8">
            {emailSent ? content : t("step1_desc")}
          </p>

          {emailSent ? (
            <div className="w-full space-y-3">
              <div className="flex items-center gap-3 rounded-2xl bg-[#f3fadf] border border-[#84BF43]/40 px-5 py-4 text-sm text-[#548828] font-medium text-left">
                <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0 fill-[#84BF43]">
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                </svg>
                {t("email_sent_hint")}
              </div>
              <button
                onClick={verifyMyEmail}
                disabled={loading || !canTryAgain}
                className="w-full py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:border-[#84BF43]/60 hover:text-[#548828] hover:bg-[#f3fadf]/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? t("sending") : t("try_again")}
              </button>
            </div>
          ) : (
            <button
              onClick={verifyMyEmail}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#84BF43] hover:bg-[#6aab2e] active:scale-[0.98] text-white text-sm font-bold tracking-wide transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-[#84BF43]/30"
            >
              {loading ? t("sending") : t("sendValidationEmail")}
            </button>
          )}
        </div>
      )}

      {/* ── Step 2 — Success ── */}
      {active === 2 && !isError && (
        <div className="flex flex-col items-center text-center w-full">
          <div className="mb-6">
            <SuccessIllustration />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {t("success_title")}
          </h2>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-6">
            {content ?? t("validation_with_success")}
          </p>
          <div className="flex items-center gap-2 text-xs text-[#548828] font-semibold bg-[#f3fadf] border border-[#84BF43]/30 rounded-full px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#84BF43] animate-pulse" />
            {t("redirect_hint")}
          </div>
        </div>
      )}

      {/* ── Step 2 — Error ── */}
      {active === 2 && isError && (
        <div className="flex flex-col items-center text-center w-full">
          <div className="mb-6">
            <ErrorIllustration />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">
            {t("error_title")}
          </h2>
          <p className="text-sm text-gray-500 max-w-xs leading-relaxed mb-8">
            {content ?? t("something_went_wrong")}
          </p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-[#84BF43]/50 hover:text-[#548828] hover:bg-[#f3fadf]/50 transition-all"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
              <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
            </svg>
            {t("back_to_login")}
          </a>
        </div>
      )}
    </div>
  );
}
