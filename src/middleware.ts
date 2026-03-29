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
  const hostname = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(hostname);
  const { pathname } = request.nextUrl;

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

    return NextResponse.rewrite(
      new URL(`/platform${pathname}`, request.url),
      { request: { headers: requestHeaders } }
    );
  }

  return NextResponse.rewrite(
    new URL(`/site/${subdomain}${pathname}`, request.url),
    { request: { headers: requestHeaders } }
  );
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
