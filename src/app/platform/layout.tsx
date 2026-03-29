import Link from "next/link";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            SportHub
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">
              Тарифы
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Создать лигу
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} SportHub. Все права защищены.
            </p>
            <div className="flex gap-6 text-sm text-gray-500">
              <Link href="/pricing" className="hover:text-gray-900">
                Тарифы
              </Link>
              <a href="#" className="hover:text-gray-900">
                Политика конфиденциальности
              </a>
              <a href="#" className="hover:text-gray-900">
                Пользовательское соглашение
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
