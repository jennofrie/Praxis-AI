import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Admin email addresses - must match config/admin.ts
const ADMIN_EMAILS = [
  'markaberiongibson@gmail.com',
  'daguiljennofrie@gmail.com',
] as const;

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase() as typeof ADMIN_EMAILS[number]);
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname;

  // Public routes (always accessible)
  const publicRoutes = ['/login', '/signup', '/auth'];
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  // Admin-only routes (require admin email)
  const adminRoutes = ['/admin', '/settings/users', '/settings/integrations', '/settings/prompts'];
  const isAdminRoute = adminRoutes.some(route => path.startsWith(route));

  // If user is NOT logged in and trying to access a protected route
  if (!user && !isPublicRoute) {
    // Redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If user IS logged in and trying to access login/signup
  if (user && isPublicRoute && path !== '/auth/callback') { // Allow callback to proceed
    // Redirect to dashboard (root)
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // If user is trying to access an admin-only route without admin privileges
  if (user && isAdminRoute && !isAdminEmail(user.email)) {
    // Redirect to home with unauthorized message
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('error', 'unauthorized');
    return NextResponse.redirect(url);
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
