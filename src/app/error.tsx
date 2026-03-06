'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600">500</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          Algo salió mal
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Ocurrió un error inesperado. Por favor intente nuevamente.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block rounded-lg bg-[#54A0D6] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#4590c0] transition-colors"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
