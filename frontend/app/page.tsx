import type { Metadata } from 'next';
import { Zap, MapPin, Shield } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LandingHeroSearch from '@/components/landing/LandingHeroSearch';
import LandingCategoryCard from '@/components/landing/LandingCategoryCard';
import LandingSpaceCard from '@/components/landing/LandingSpaceCard';
import LandingCtaButtons from '@/components/landing/LandingCtaButtons';
import LandingViewAllButton from '@/components/landing/LandingViewAllButton';
import LandingClientWrapper from '@/components/landing/LandingClientWrapper';
import LandingBento from '@/components/landing/LandingBento';
import { getSpacesServer } from '@/lib/spaces-server';
import { T } from '@/i18n';
import { LANG_COOKIE_NAME, resolveLang, translateServer } from '@/i18n/server';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://coworkingpass.sa'),
  title: 'Coworking Pass | Flexible Coworking Spaces Across Saudi Arabia',
  description: 'Instantly access flexible, fully equipped coworking spaces in Riyadh, Jeddah, Dammam, and beyond. Book private offices, meeting rooms, and theaters across Saudi Arabia.',
  keywords: [
    'coworking saudi arabia',
    'coworking riyadh',
    'shared office jeddah',
    'dammam meeting rooms',
    'flexible workspace',
    'private office saudi',
    'coworking pass',
    'office spaces khobar',
    'meeting halls saudi arabia',
  ],
  openGraph: {
    title: 'Coworking Pass - Saudi Arabia\'s Premier Coworking Network',
    description: 'Instantly access flexible, fully equipped coworking spaces in Riyadh, Jeddah, Dammam, and beyond. Book by the day, month, or year.',
    url: 'https://coworkingpass.sa',
    siteName: 'Coworking Pass',
    images: [
      {
        url: '/landing-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Coworking Pass - Workspaces Across Saudi Arabia',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Coworking Pass | Flexible Coworking Spaces Across Saudi Arabia',
    description: 'Find and book flexible desks, offices, and conference halls across the Kingdom with zero lock-in.',
    images: ['/landing-hero.jpg'],
  },
  alternates: {
    canonical: '/',
  },
};

export default async function Page() {
  const { featuredSpaces, categoryCounts } = await getSpacesServer();
  const storedLang = (await cookies()).get(LANG_COOKIE_NAME)?.value;
  const lang = resolveLang(storedLang);

  // Structured Data (JSON-LD) for Search Engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Coworking Pass',
    url: 'https://coworkingpass.sa',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://coworkingpass.sa/spaces?city={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
    hasPart: featuredSpaces.map(space => ({
      '@type': 'Place',
      name: space.name,
      description: space.description,
      address: {
        '@type': 'PostalAddress',
        addressLocality: space.city,
        streetAddress: space.address,
        addressCountry: 'SA',
      },
      geo: space.coordinates
        ? {
            '@type': 'GeoCoordinates',
            latitude: space.coordinates.lat,
            longitude: space.coordinates.lng,
          }
        : undefined,
      aggregateRating: space.rating && (space.reviewCount ?? 0) > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: space.rating,
            reviewCount: space.reviewCount,
          }
        : undefined,
    })),
  };

  return (
    <LandingClientWrapper>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen flex flex-col bg-plaster">
        <Navbar />

        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 w-full">
            <div className="flex flex-col items-center text-center gap-5 max-w-5xl mx-auto">
              <span className="inline-flex items-center gap-2 h-8 ps-1.5 pe-3.5 rounded-full bg-white border border-zinc-200/80 shadow-sm text-xs sm:text-[13px] text-soot-light">
                <span className="inline-flex items-center gap-1 h-5 px-2 rounded-full bg-accent-soft text-accent font-semibold text-[11px]">
                  <Zap size={11} fill="currentColor" />
                  <T k="landing.newBadge" />
                </span>
                <T k="landing.heroBadge" />
              </span>

              <h1 className="text-[42px] sm:text-6xl lg:text-[72px] leading-[1.04] text-soot text-balance">
                <T k="landing.heroLine1" /><br />
                <span className="text-soot-light"><T k="landing.heroLine2" /></span>
              </h1>

              <p className="text-soot-light text-base sm:text-lg leading-relaxed max-w-2xl text-pretty">
                <T k="landing.heroBody" />
              </p>
            </div>

            {/* Hero photograph with the floating search capsule */}
            <div className="relative mt-10 sm:mt-12 pb-6 lg:pb-14">
              <div className="relative h-64 sm:h-96 lg:h-[500px] rounded-[32px] overflow-hidden bg-soot">
                <img
                  src="/landing-hero.jpg"
                  alt={translateServer(lang, 'landing.alt.hero')}
                  className="w-full h-full object-cover object-center"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-soot/45 pointer-events-none" />
                <div className="absolute top-5 start-5 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white text-xs sm:text-[13px] font-medium">
                  <MapPin size={14} />
                  <T k="landing.verifiedWorkspaces" />
                </div>
              </div>

              <div className="relative -mt-10 sm:-mt-14 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 px-3 sm:px-8 lg:px-12">
                <LandingHeroSearch />
              </div>
            </div>
          </section>

          {/* Space Categories Section */}
          <section className="py-16 max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <p className="text-moss text-xs font-semibold uppercase tracking-wider mb-2"><T k="landing.categoriesEyebrow" /></p>
              <h2 className="text-3xl sm:text-4xl text-soot font-normal font-serif-display">
                <T k="landing.categoriesTitle" />
              </h2>
              <p className="text-moss text-sm mt-2">
                <T k="landing.categoriesBody" />
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LandingCategoryCard
                category="office"
                count={categoryCounts.office}
              />
              <LandingCategoryCard
                category="hall"
                count={categoryCounts.hall}
              />
              <LandingCategoryCard
                category="theater"
                count={categoryCounts.theater}
              />
            </div>
          </section>

          {/* Featured Spaces Section (Server Rendered for SEO) */}
          <section className="py-12 max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-moss text-xs font-semibold uppercase tracking-wider mb-2"><T k="landing.featuredEyebrow" /></p>
                <h2 className="text-4xl sm:text-5xl text-soot font-normal font-serif-display"><T k="landing.featuredTitle" /></h2>
              </div>
              <LandingViewAllButton />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {featuredSpaces.map(space => (
                <LandingSpaceCard key={space.id} space={space} />
              ))}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <LandingViewAllButton isMobile />
            </div>
          </section>

          {/* How It Works Section */}
          <section className="py-24 bg-plaster-dark/25 border-y border-soot/8 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-plaster-surface border border-soot/10 text-moss text-xs font-semibold mb-3 shadow-xs">
                  <Zap size={13} className="text-eucalyptus shrink-0" />
                  <span><T k="landing.howEyebrow" /></span>
                </div>
                <h2 className="text-4xl sm:text-5xl text-soot font-normal font-serif-display tracking-tight mb-4">
                  <T k="landing.howTitle" />
                </h2>
                <p className="text-moss text-sm sm:text-base leading-relaxed">
                  <T k="landing.howBody" />
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Step 1 */}
                <div className="group bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-soot/5 border border-soot/8">
                      <img
                        src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80"
                        alt={translateServer(lang, 'landing.alt.browse')}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-soot/20 to-transparent" />
                      <div className="absolute bottom-3 start-3 end-3 bg-plaster-surface/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-soot/10 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-moss shrink-0" />
                          <span className="text-[11px] font-semibold text-soot"><T k="landing.step1.place" /></span>
                        </div>
                        <span className="text-[10px] font-bold text-eucalyptus uppercase bg-soot/90 px-2 py-0.5 rounded-md"><T k="landing.step1.count" /></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-6 h-6 rounded-full bg-soot text-plaster text-xs font-bold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <h3 className="text-xl font-semibold text-soot font-serif-display">
                        <T k="landing.step1.title" />
                      </h3>
                    </div>
                    <p className="text-moss text-xs sm:text-sm leading-relaxed mt-2">
                      <T k="landing.step1.body" />
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="group bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-soot/5 border border-soot/8">
                      <img
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80"
                        alt={translateServer(lang, 'landing.alt.plan')}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-soot/20 to-transparent" />
                      <div className="absolute bottom-3 start-3 end-3 bg-plaster-surface/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-soot/10 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2">
                          <Zap size={13} className="text-moss shrink-0" />
                          <span className="text-[11px] font-semibold text-soot"><T k="landing.step2.place" /></span>
                        </div>
                        <span className="text-[10px] font-bold text-soot bg-eucalyptus/30 border border-soot/10 px-2 py-0.5 rounded-md"><T k="landing.step2.count" /></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-6 h-6 rounded-full bg-soot text-plaster text-xs font-bold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <h3 className="text-xl font-semibold text-soot font-serif-display">
                        <T k="landing.step2.title" />
                      </h3>
                    </div>
                    <p className="text-moss text-xs sm:text-sm leading-relaxed mt-2">
                      <T k="landing.step2.body" />
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="group bg-plaster-surface rounded-3xl border border-soot/12 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between overflow-hidden">
                  <div>
                    <div className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-soot/5 border border-soot/8">
                      <img
                        src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600&auto=format&fit=crop&q=80"
                        alt={translateServer(lang, 'landing.alt.access')}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-soot/70 via-soot/20 to-transparent" />
                      <div className="absolute bottom-3 start-3 end-3 bg-plaster-surface/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-soot/10 flex items-center justify-between shadow-md">
                        <div className="flex items-center gap-2">
                          <Shield size={13} className="text-eucalyptus shrink-0 stroke-[3]" />
                          <span className="text-[11px] font-semibold text-soot"><T k="landing.step3.place" /></span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-plaster bg-soot px-2 py-0.5 rounded-md"><T k="landing.step3.count" /></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-6 h-6 rounded-full bg-soot text-plaster text-xs font-bold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <h3 className="text-xl font-semibold text-soot font-serif-display">
                        <T k="landing.step3.title" />
                      </h3>
                    </div>
                    <p className="text-moss text-xs sm:text-sm leading-relaxed mt-2">
                      <T k="landing.step3.body" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Platform Bento Grid */}
          <section className="py-24 max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="flex flex-col gap-3 max-w-2xl">
                <p className="text-accent text-xs font-semibold uppercase tracking-wider"><T k="landing.bento.eyebrow" /></p>
                <h2 className="text-4xl sm:text-5xl text-soot leading-[1.08]">
                  <T k="landing.bento.title" />
                </h2>
              </div>
              <p className="text-soot-light text-base leading-relaxed max-w-sm">
                <T k="landing.bento.body" />
              </p>
            </div>

            <LandingBento />
          </section>

          {/* CTA Section */}
          <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="relative w-full bg-soot rounded-3xl p-10 sm:p-16 text-center overflow-hidden border border-soot/20 shadow-2xl">
              <div className="absolute top-0 end-0 -me-24 -mt-24 w-80 h-80 rounded-full bg-eucalyptus/10 blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 start-0 -ms-24 -mb-24 w-80 h-80 rounded-full bg-eucalyptus/5 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-5xl text-plaster mb-4 font-normal font-serif-display tracking-tight">
                  <T k="landing.ctaTitle" />
                </h2>
                <p className="text-plaster/80 text-sm sm:text-base mb-8 leading-relaxed max-w-xl mx-auto">
                  <T k="landing.ctaBody" />
                </p>

                <LandingCtaButtons />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </LandingClientWrapper>
  );
}
