import ValidationStepper from "../../src/components/validationStepper";
import { withTranslations } from "../../src/helpers/HOC/withTranslations";
import { useAuthContext } from "../../src/context/AuthContext";

export default function Validation() {
  const { logout } = useAuthContext();

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
          <ValidationStepper active={1} />
        </div>

        {/* Footer */}
        <div className="flex flex-col items-center gap-3 mt-8">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors group"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
              <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Zm10.97 4.22-1.47-1.47a.75.75 0 0 0-1.06 1.06l.19.19H8.5a.75.75 0 0 0 0 1.5h3.13l-.19.19a.75.75 0 1 0 1.06 1.06l1.47-1.47a.75.75 0 0 0 0-1.06Z" clipRule="evenodd" />
            </svg>
            Se déconnecter
          </button>
          <p className="text-xs text-gray-300">
            © {new Date().getFullYear()} qu2data · DataSense Pro
          </p>
        </div>
      </div>
    </div>
  );
}

export const getStaticProps = withTranslations(undefined, ["validation"]);
