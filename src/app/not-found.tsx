import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-600">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          Página no encontrada
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-[#54A0D6] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#4590c0] transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
