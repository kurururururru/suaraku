import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const path = request.nextUrl.pathname;

  // Define paths
  const isLoginPath = path === '/login' || path === '/admin/login';
  const isAdminPath = path.startsWith('/admin') && path !== '/admin/login';
  const isDashboardPath = path.startsWith('/dashboard');

  if (!token) {
    if (isAdminPath) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (isDashboardPath) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Decode JWT payload (without verifying signature - backend validates it later)
  try {
    const payloadBase64 = token.split('.')[1];
    // Base64Url decode logic
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const decodedJson = atob(base64);
    const payload = JSON.parse(decodedJson);
    const role = payload.role; // 'ADMIN' or 'VOTER'

    // If accessing login page while authenticated, redirect to respective dashboard
    if (isLoginPath) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect admin routes from voters
    if (isAdminPath && role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Protect voter routes from admin
    if (isDashboardPath && role !== 'VOTER') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

  } catch (error) {
    // Invalid token structure
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};
