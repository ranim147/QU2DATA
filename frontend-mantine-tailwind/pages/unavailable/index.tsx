import { useRouter } from "next/router";

export default function unavailable() {
  const router = useRouter();

  function lastRoute() {
    router.push("/");
  }
  return (
    <div className="h-screen flex justify-center items-center">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-xl w-full">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">
          500 Internal Server Error
        </h2>
        <p className="text-lg text-gray-600 mb-8 text-center">
          Oops! Something went wrong on our server. We're working hard to fix
          it. Please try again later.
        </p>
        <div className="flex justify-center" onClick={lastRoute}>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
