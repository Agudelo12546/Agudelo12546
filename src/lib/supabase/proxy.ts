import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

const PUBLIC_PREFIXES = ["/ingresar", "/registro", "/legal", "/auth"];

function isPublic(pathname: string) {
  return pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Refresca la sesión en cada solicitud y manda a /ingresar a quien no ha iniciado sesión. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/ingresar";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (user && (pathname === "/ingresar" || pathname === "/registro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/empresas";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
