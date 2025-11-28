import { NextResponse } from 'next/server'

function getAvailableLocales() {
  const enableMulti = process.env.NEXT_PUBLIC_ENABLE_MULTI_LANG === 'true'
  const list = process.env.NEXT_PUBLIC_AVAILABLE_LANGUAGES
  const def = (process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'en').toLowerCase()

  if (enableMulti && list) {
    return list.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  }
  return [def]
}

function normalizeTag(tag) {
  return tag?.replace('_', '-').toLowerCase()
}

function parseAcceptLanguage(header) {
  if (!header) return []
  try {
    return header
      .split(',')
      .map((part) => {
        const [lang, qStr] = part.trim().split(';')
        const q = qStr ? parseFloat(qStr.split('=')[1]) || 1 : 1
        return { tag: normalizeTag(lang), q }
      })
      .filter((x) => !!x.tag)
      .sort((a, b) => b.q - a.q)
      .map((x) => x.tag)
  } catch (e) {
    return []
  }
}

function pickLocaleByCountry(available, countryCode) {
  if (!countryCode) return null
  const cc = countryCode.toUpperCase()

  // Preferred mappings by country to locale
  const map = {
    DE: 'de',
    AT: 'de',
    CH: 'de',
    NO: 'nb',
    DK: 'da',
    SE: 'sv-se', // may not exist; will be checked against available
    FI: 'fi',
    NL: 'nl',
    BE: 'nl',
    FR: 'fr',
    ES: 'es-es',
    MX: 'es-419',
    AR: 'es-419',
    CO: 'es-419',
    BR: 'pt-br',
    PT: 'pt',
    IT: 'it',
    GB: 'en',
    IE: 'en',
    US: 'en',
    CA: 'en',
    AU: 'en',
    NZ: 'en',
    IN: 'hi',
    PK: 'ur-pk',
    SA: 'ar',
    AE: 'ar',
    EG: 'ar',
    TR: 'tr',
    RU: 'ru',
    UA: 'uk',
    RO: 'ro',
    BG: 'bg',
    GR: 'el',
    PL: 'pl',
    CZ: 'cs',
    SK: 'sk',
    HU: 'hu',
    ID: 'id',
    JP: 'ja',
    KR: 'ko',
    CN: 'zh-cn',
    TW: 'zh-hant',
    HK: 'zh-hant',
    VN: 'vi',
    IR: 'fa',
    IL: 'he',
  }

  const desired = normalizeTag(map[cc])
  if (!desired) return null

  // Prefer exact tag if present
  if (available.includes(desired)) return desired

  // Fallback to primary language (e.g., pt from pt-br)
  const primary = desired.split('-', 1)[0]
  if (available.includes(primary)) return primary

  return null
}

function pickBestLocale({ available, acceptLanguage, countryCode, defaultLocale }) {
  // 1) Country / region preference
  const byCountry = pickLocaleByCountry(available, countryCode)
  if (byCountry) return byCountry

  // 2) Accept-Language negotiation (exact then primary)
  const tags = parseAcceptLanguage(acceptLanguage)
  for (const tag of tags) {
    if (available.includes(tag)) return tag
    const primary = tag.split('-', 1)[0]
    if (available.includes(primary)) return primary
  }

  // 3) Fallback
  return normalizeTag(defaultLocale) || 'en'
}

export function middleware(request) {
  const available = getAvailableLocales()
  const defaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE || 'en'

  // If a locale is already prefixed in the path, or cookie present, pass through
  const pathname = request.nextUrl.pathname
  const hasPrefix = available.some((loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`))
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && available.includes(normalizeTag(cookieLocale))) {
    return NextResponse.next()
  }
  if (hasPrefix) {
    return NextResponse.next()
  }

  const acceptLanguage = request.headers.get('accept-language') || ''

  // Detect country from Vercel / Cloudflare headers or NextRequest geo
  const countryCode =
    request.geo?.country ||
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    request.headers.get('x-country-code') ||
    request.headers.get('x-geo-country') ||
    ''

  const locale = pickBestLocale({
    available,
    acceptLanguage, 
    countryCode,
    defaultLocale,
  })

  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`

  const response = NextResponse.redirect(url)
  response.cookies.set('NEXT_LOCALE', locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  })

  return response
}

export const config = {
  matcher: [
    // All paths except static, API, or image routes
    '/((?!_next|api|images).*)',
  ],
}
