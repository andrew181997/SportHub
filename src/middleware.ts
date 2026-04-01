import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "sporthub.ru";

function extractSubdomain(hostname: string): string | null {
  const localhostMatch = hostname.match(/^(.+)\.localhost/);
  if (localhostMatch) return localhostMatch[1];

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return hostname.replace(`.${ROOT_DOMAIN}`, "");
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Не переписывать API и статику: иначе /api/search → /site/{slug}/api/search (маршрута нет) и приходит text/html.
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/uploads")
  ) {
    return NextResponse.next();
  }

  const hostname = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(hostname);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (!subdomain || subdomain === "www") {
    if (pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (pathname === "/superadmin") {
      return NextResponse.redirect(
        new URL("/superadmin/dashboard", request.url)
      );
    }

    const platformUrl = request.nextUrl.clone();
    platformUrl.pathname = `/platform${pathname}`;
    return NextResponse.rewrite(platformUrl, {
      request: { headers: requestHeaders },
    });
  }

  const siteUrl = request.nextUrl.clone();
  siteUrl.pathname = `/site/${subdomain}${pathname}`;
  return NextResponse.rewrite(siteUrl, {
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
