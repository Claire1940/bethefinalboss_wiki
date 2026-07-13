"use client";

import { useState, Suspense, lazy } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ClipboardCheck,
  Clock,
  Coins,
  Copy,
  Crosshair,
  Ghost,
  Hammer,
  HeartPulse,
  Infinity as InfinityIcon,
  ListOrdered,
  Package,
  RotateCcw,
  Scale,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { VideoFeature } from "@/components/home/VideoFeature";
import { LatestGuidesAccordion } from "@/components/home/LatestGuidesAccordion";
import { NativeBannerAd, AdBanner } from "@/components/ads";
import { getPreferredMobileBannerSelection } from "@/components/ads/mobileAdConfigs";
import { scrollToSection } from "@/lib/scrollToSection";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { ContentItemWithType } from "@/lib/getLatestArticles";
import type { ModuleLinkMap } from "@/lib/buildModuleLinkMap";

// Lazy load heavy components
const HeroStats = lazy(() => import("@/components/home/HeroStats"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));
const CTASection = lazy(() => import("@/components/home/CTASection"));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`}
  />
);

// Tier / rank badge styles — all derived from the global theme color, no hardcoded hex
const TIER_STYLES: Record<string, string> = {
  S: "bg-[hsl(var(--nav-theme)/0.25)] border-[hsl(var(--nav-theme)/0.6)] text-[hsl(var(--nav-theme-light))]",
  A: "bg-[hsl(var(--nav-theme)/0.18)] border-[hsl(var(--nav-theme)/0.45)] text-[hsl(var(--nav-theme-light))]",
  B: "bg-[hsl(var(--nav-theme)/0.12)] border-[hsl(var(--nav-theme)/0.35)] text-foreground",
  C: "bg-white/5 border-border text-muted-foreground",
};

// Strategy priority badge styles — Essential uses the theme color, others use
// Tailwind semantic colors for clear differentiation (no hardcoded hex).
const PRIORITY_STYLES: Record<string, string> = {
  Essential:
    "bg-[hsl(var(--nav-theme)/0.2)] border-[hsl(var(--nav-theme)/0.5)] text-[hsl(var(--nav-theme-light))]",
  High: "bg-amber-500/10 border-amber-500/30 text-amber-500",
  "Late Game": "bg-sky-500/10 border-sky-500/30 text-sky-500",
  Emergency: "bg-rose-500/10 border-rose-500/30 text-rose-500",
  default: "bg-white/5 border-border text-muted-foreground",
};

// Update timeline status badge styles — Active uses the theme color.
const STATUS_STYLES: Record<string, string> = {
  Live: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
  Active:
    "bg-[hsl(var(--nav-theme)/0.2)] border-[hsl(var(--nav-theme)/0.5)] text-[hsl(var(--nav-theme-light))]",
  "Official Source": "bg-sky-500/10 border-sky-500/30 text-sky-500",
  Monitoring: "bg-amber-500/10 border-amber-500/30 text-amber-500",
  default: "bg-white/5 border-border text-muted-foreground",
};

// Distinct lucide icons per card inside modules 5-7 (no repeated icons within
// a single card grid). Section eyebrow icons are separate and may reuse names.
const SKILL_BUILD_ICONS = [Scale, Skull, HeartPulse];
const CURRENCY_ICONS = [Coins, Ghost];
const STRATEGY_ICONS = [Swords, Crosshair, Target, Zap, InfinityIcon, RotateCcw];

// Conditionally render text as a link or plain span
function LinkedTitle({
  linkData,
  children,
  className,
  locale,
}: {
  linkData: { url: string; title: string } | null | undefined;
  children: React.ReactNode;
  className?: string;
  locale: string;
}) {
  if (linkData) {
    const href = locale === "en" ? linkData.url : `/${locale}${linkData.url}`;
    return (
      <Link
        href={href}
        className={`${className || ""} hover:text-[hsl(var(--nav-theme-light))] hover:underline decoration-[hsl(var(--nav-theme-light))/0.4] underline-offset-4 transition-colors`}
        title={linkData.title}
      >
        {children}
      </Link>
    );
  }
  return <>{children}</>;
}

// Tools Grid navigation card — smooth-scrolls to the matching <section id>
// href is a literal "#sectionId" string so anchor links stay countable.
function NavCard({
  href,
  card,
  index,
}: {
  href: string;
  card: { icon: string; title: string; description: string };
  index: number;
}) {
  const sectionId = href.replace(/^#/, "");
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        scrollToSection(sectionId);
      }}
      className="scroll-reveal group rounded-xl border border-border p-4 md:p-6
                 bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                 transition-all duration-300 cursor-pointer text-left
                 hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div
        className="mb-3 h-10 w-10 rounded-lg md:mb-4 md:h-12 md:w-12
                   bg-[hsl(var(--nav-theme)/0.1)]
                   flex items-center justify-center
                   group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                   transition-colors"
      >
        <DynamicIcon
          name={card.icon}
          className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]"
        />
      </div>
      <h3 className="mb-1.5 text-sm md:text-base font-semibold">{card.title}</h3>
      <p className="text-sm text-muted-foreground">{card.description}</p>
    </a>
  );
}

interface HomePageClientProps {
  latestArticles: ContentItemWithType[];
  moduleLinkMap: ModuleLinkMap;
  locale: string;
}

export default function HomePageClient({
  latestArticles,
  moduleLinkMap,
  locale,
}: HomePageClientProps) {
  const t = useMessages() as any;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.bethefinalboss.wiki";

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Be The Final Boss Wiki",
        description:
          "Complete Be The Final Boss Wiki covering working codes, minions, weapons, skill tree, waves, currencies, and the latest Roblox updates.",
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Be The Final Boss - Reverse Tower Defense Boss Simulator on Roblox",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Be The Final Boss Wiki",
        alternateName: "Be The Final Boss",
        url: siteUrl,
        description:
          "Complete Be The Final Boss Wiki resource hub for codes, minions, weapons, skill tree, waves, and currency guides",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Be The Final Boss Wiki - Reverse Tower Defense Boss Simulator on Roblox",
        },
        sameAs: [
          "https://www.roblox.com/games/140302982046391/Be-The-Final-Boss",
          "https://x.com/ApparentlyGames",
        ],
      },
      {
        "@type": "VideoGame",
        name: "Be The Final Boss",
        gamePlatform: ["PC", "Mac", "Mobile", "Console"],
        applicationCategory: "Game",
        genre: ["Strategy", "Tower Defense", "Simulation", "Action"],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 1,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.roblox.com/games/140302982046391/Be-The-Final-Boss",
        },
      },
      {
        "@type": "VideoObject",
        name: "Playing the New Roblox Game Be The Final Boss",
        description:
          "Be The Final Boss gameplay preview — summon minions, defend the castle, and survive endless hero waves.",
        uploadDate: "2026-07-11",
        thumbnailUrl: `${siteUrl}/images/hero.webp`,
        embedUrl: "https://www.youtube.com/embed/NAFB1w68Q6U",
        url: "https://www.youtube.com/watch?v=NAFB1w68Q6U",
      },
    ],
  };

  // Copy-to-clipboard state for the Codes module
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const mobileBannerAd = getPreferredMobileBannerSelection();

  const copyCode = (code: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const codes = t.modules?.beTheFinalBossCodes;
  const redemptionSteps: string[] =
    (codes?.items?.[0]?.redemption_steps as string[]) || [];

  return (
    <div className="home-shell min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 广告位 1: 顶部固定横幅 */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-4 md:mb-6"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.hero.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-[1.05]">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:mb-10 md:max-w-3xl md:text-2xl">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row md:mb-12 md:gap-4">
              <button
                onClick={() => scrollToSection("codes")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-base md:text-lg transition-colors"
              >
                <Sparkles className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://www.roblox.com/games/140302982046391/Be-The-Final-Boss"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-base md:text-lg transition-colors"
              >
                {t.hero.playOnRobloxCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* Video Section - 紧跟 Hero，容器宽度上限 max-w-5xl，避免挤压广告展示空间 */}
      <section className="px-4 py-10 md:py-12">
        <div className="scroll-reveal container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl">
            <VideoFeature
              videoId="NAFB1w68Q6U"
              title="Playing the New Roblox Game Be The Final Boss"
            />
          </div>
        </div>
      </section>

      {/* Tools Grid - 8 Navigation Cards（位于视频区之后、Latest Updates 之前） */}
      <section className="px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.tools.title}{" "}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            <NavCard href="#codes" card={t.tools.cards[0]} index={0} />
            <NavCard href="#beginner-guide" card={t.tools.cards[1]} index={1} />
            <NavCard href="#minion-tier-list" card={t.tools.cards[2]} index={2} />
            <NavCard href="#best-weapons" card={t.tools.cards[3]} index={3} />
            <NavCard href="#skill-tree" card={t.tools.cards[4]} index={4} />
            <NavCard href="#coins-and-souls" card={t.tools.cards[5]} index={5} />
            <NavCard href="#castle-defense" card={t.tools.cards[6]} index={6} />
            <NavCard href="#updates" card={t.tools.cards[7]} index={7} />
          </div>
        </div>
      </section>

      {/* 广告位 2: 首屏内容之后再加载广告 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ""} />

      {/* 广告位 3: 移动端优先使用方形，桌面端保留横幅 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Module 1: Be The Final Boss Codes */}
      <section id="codes" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">Free Rewards</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle
                linkData={moduleLinkMap["beTheFinalBossCodes"]}
                locale={locale}
              >
                {t.modules.beTheFinalBossCodes.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.beTheFinalBossCodes.intro}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 md:mb-10 scroll-reveal">
            {/* Left: code cards */}
            <div className="space-y-4">
              {t.modules.beTheFinalBossCodes.items.map((item: any, index: number) => (
                <div
                  key={index}
                  className="p-5 md:p-6 bg-white/5 border border-border rounded-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme)/0.4)] text-[hsl(var(--nav-theme-light))] font-medium">
                      <Check className="w-3 h-3" /> {item.status}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Reward:{" "}
                      <span className="font-semibold text-foreground">
                        {item.reward}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <code className="flex-1 px-4 py-3 rounded-lg bg-background border border-[hsl(var(--nav-theme)/0.3)] text-lg md:text-xl font-bold tracking-wide text-[hsl(var(--nav-theme-light))]">
                      {item.code}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyCode(item.code)}
                      aria-label={`Copy code ${item.code}`}
                      className="inline-flex items-center justify-center w-11 h-11 rounded-lg border border-border hover:bg-white/10 transition-colors"
                    >
                      {copiedCode === item.code ? (
                        <Check className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">Best use:</span>{" "}
                    {item.best_use}
                  </p>
                </div>
              ))}
            </div>

            {/* Right: redemption steps */}
            <div className="p-5 md:p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardCheck className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                <h3 className="font-bold text-base md:text-lg">How to Redeem</h3>
              </div>
              <ol className="space-y-3">
                {redemptionSteps.map((step: string, i: number) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[hsl(var(--nav-theme)/0.2)] border border-[hsl(var(--nav-theme)/0.5)] flex items-center justify-center text-xs font-bold text-[hsl(var(--nav-theme-light))]">
                      {i + 1}
                    </span>
                    <span className="text-sm text-muted-foreground pt-0.5">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Code tips */}
          <div className="scroll-reveal p-4 md:p-6 bg-white/5 border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <Sparkles className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-base md:text-lg">Code Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.beTheFinalBossCodes.tips.map((tip: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 广告位 4: 第一模块之后的阅读停顿位 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* Module 2: Be The Final Boss Beginner Guide */}
      <section id="beginner-guide" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <BookOpen className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">Getting Started</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle
                linkData={moduleLinkMap["beTheFinalBossBeginnerGuide"]}
                locale={locale}
              >
                {t.modules.beTheFinalBossBeginnerGuide.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.beTheFinalBossBeginnerGuide.intro}
            </p>
          </div>

          {/* Steps */}
          <div className="scroll-reveal space-y-3 md:space-y-4 mb-8 md:mb-10">
            {t.modules.beTheFinalBossBeginnerGuide.steps.map(
              (step: any, index: number) => (
                <div
                  key={index}
                  className="flex gap-3 md:gap-4 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                    <span className="text-base md:text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                      {index + 1}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">
                      {step.title}
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>

          {/* Quick Tips */}
          <div className="scroll-reveal p-4 md:p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <BookOpen className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-base md:text-lg">Quick Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.beTheFinalBossBeginnerGuide.quickTips.map(
                (tip: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                    <span className="text-muted-foreground text-sm">{tip}</span>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* Module 3: Be The Final Boss Minion Tier List */}
      <section id="minion-tier-list" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Users className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">Army Ranking</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle
                linkData={moduleLinkMap["beTheFinalBossMinionTierList"]}
                locale={locale}
              >
                {t.modules.beTheFinalBossMinionTierList.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.beTheFinalBossMinionTierList.intro}
            </p>
          </div>

          <div className="scroll-reveal space-y-4">
            {t.modules.beTheFinalBossMinionTierList.tiers.map(
              (tier: any, index: number) => (
                <div
                  key={index}
                  className="p-4 md:p-6 bg-white/5 border border-border rounded-xl"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-5">
                    <div className="flex items-center gap-3 md:w-52 flex-shrink-0">
                      <span
                        className={`flex w-12 h-12 items-center justify-center rounded-xl border-2 text-xl font-bold ${TIER_STYLES[tier.tier] || TIER_STYLES.C}`}
                      >
                        {tier.tier}
                      </span>
                      <h3 className="font-bold text-base md:text-lg">
                        {tier.label}
                      </h3>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {tier.minions.map((m: string, mi: number) => (
                          <span
                            key={mi}
                            className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-border"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-semibold text-foreground">
                          Strengths:
                        </span>{" "}
                        {tier.strengths}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Investment:
                        </span>{" "}
                        {tier.investment}
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Module 4: Be The Final Boss Best Weapons */}
      <section id="best-weapons" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Hammer className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                Weapon Progression
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle
                linkData={moduleLinkMap["beTheFinalBossBestWeapons"]}
                locale={locale}
              >
                {t.modules.beTheFinalBossBestWeapons.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.beTheFinalBossBestWeapons.intro}
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block scroll-reveal overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Rank</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Weapon Choice
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Best For</th>
                  <th className="px-4 py-3 text-left font-semibold">Strength</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Upgrade Priority
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.modules.beTheFinalBossBestWeapons.weapons.map(
                  (w: any, index: number) => (
                    <tr key={index} className="border-t border-border">
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex w-9 h-9 items-center justify-center rounded-lg border-2 font-bold ${TIER_STYLES[w.rank] || TIER_STYLES.C}`}
                        >
                          {w.rank}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium">{w.weapon_choice}</td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {w.best_for}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {w.strength}
                      </td>
                      <td className="px-4 py-4">{w.upgrade_priority}</td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden scroll-reveal space-y-3">
            {t.modules.beTheFinalBossBestWeapons.weapons.map(
              (w: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-white/5 border border-border rounded-xl"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`inline-flex w-9 h-9 items-center justify-center rounded-lg border-2 font-bold ${TIER_STYLES[w.rank] || TIER_STYLES.C}`}
                    >
                      {w.rank}
                    </span>
                    <h3 className="font-bold">{w.weapon_choice}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-semibold text-foreground">Best for:</span>{" "}
                    {w.best_for}
                  </p>
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-semibold text-foreground">Strength:</span>{" "}
                    {w.strength}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      Upgrade priority:
                    </span>{" "}
                    {w.upgrade_priority}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* 广告位 5: 移动端横幅 */}
      {mobileBannerAd && (
        <AdBanner
          type={mobileBannerAd.type}
          adKey={mobileBannerAd.adKey}
          className="md:hidden"
        />
      )}

      {/* Module 5: Be The Final Boss Skill Tree Builds */}
      <section id="skill-tree" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                Permanent Upgrades
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle
                linkData={moduleLinkMap["beTheFinalBossSkillTree"]}
                locale={locale}
              >
                {t.modules.beTheFinalBossSkillTree.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.beTheFinalBossSkillTree.intro}
            </p>
          </div>

          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {t.modules.beTheFinalBossSkillTree.builds.map(
              (build: any, index: number) => {
                const Icon = SKILL_BUILD_ICONS[index];
                return (
                  <div
                    key={index}
                    className="flex flex-col p-5 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex w-10 h-10 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme)/0.4)]">
                        <Icon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                      </span>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">
                          {build.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {build.best_for}
                        </p>
                      </div>
                    </div>

                    <ol className="space-y-3 mb-4">
                      {build.steps.map((step: any, i: number) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex w-7 h-7 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nav-theme)/0.2)] border border-[hsl(var(--nav-theme)/0.5)] text-xs font-bold text-[hsl(var(--nav-theme-light))]">
                            {step.priority}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">{step.focus}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {step.guidance}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>

                    <div className="mt-auto p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.06)] border border-[hsl(var(--nav-theme)/0.25)]">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Result:{" "}
                        </span>
                        {build.result}
                      </p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Module 6: Be The Final Boss Coins And Souls Guide */}
      <section id="coins-and-souls" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Package className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">Currency Guide</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle
                linkData={moduleLinkMap["beTheFinalBossCoinsAndSouls"]}
                locale={locale}
              >
                {t.modules.beTheFinalBossCoinsAndSouls.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.beTheFinalBossCoinsAndSouls.intro}
            </p>
          </div>

          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6">
            {t.modules.beTheFinalBossCoinsAndSouls.currencies.map(
              (currency: any, index: number) => {
                const Icon = CURRENCY_ICONS[index];
                return (
                  <div
                    key={index}
                    className="p-5 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="flex w-10 h-10 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme)/0.4)]">
                        <Icon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{currency.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
                          {currency.purpose}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-semibold mb-1">Used For</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {currency.used_for.map((u: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                              <span>{u}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">Sources</p>
                        <ul className="space-y-1 text-muted-foreground">
                          {currency.sources.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-3 rounded-lg bg-[hsl(var(--nav-theme)/0.06)] border border-[hsl(var(--nav-theme)/0.25)]">
                        <p className="text-xs">
                          <span className="font-semibold text-foreground">
                            Spending Priority:{" "}
                          </span>
                          <span className="text-muted-foreground">
                            {currency.spending_priority}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <div className="scroll-reveal p-5 md:p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-4 md:mb-5">
              <ListOrdered className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-base md:text-lg">
                Recommended Spending Order
              </h3>
            </div>
            <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {t.modules.beTheFinalBossCoinsAndSouls.spending_order.map(
                (step: any, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-border"
                  >
                    <span className="flex w-8 h-8 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nav-theme)/0.2)] border border-[hsl(var(--nav-theme)/0.5)] text-sm font-bold text-[hsl(var(--nav-theme-light))]">
                      {step.priority}
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{step.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.details}
                      </p>
                    </div>
                  </li>
                ),
              )}
            </ol>
          </div>
        </div>
      </section>

      {/* Module 7: Be The Final Boss Castle Defense Guide */}
      <section id="castle-defense" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Shield className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">Wave Strategy</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle
                linkData={moduleLinkMap["beTheFinalBossCastleDefense"]}
                locale={locale}
              >
                {t.modules.beTheFinalBossCastleDefense.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.beTheFinalBossCastleDefense.intro}
            </p>
          </div>

          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {t.modules.beTheFinalBossCastleDefense.strategies.map(
              (s: any, index: number) => {
                const Icon = STRATEGY_ICONS[index];
                return (
                  <div
                    key={index}
                    className="p-5 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex w-10 h-10 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme)/0.4)]">
                          <Icon className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
                        </span>
                        <h3 className="font-bold text-lg">{s.name}</h3>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${PRIORITY_STYLES[s.priority] || PRIORITY_STYLES.default}`}
                      >
                        {s.priority}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {s.strategy}
                    </p>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Avoid:{" "}
                        </span>
                        {s.avoid}
                      </p>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Module 8: Be The Final Boss Updates */}
      <section id="updates" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)]">
              <Clock className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">Game Updates</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              <LinkedTitle
                linkData={moduleLinkMap["beTheFinalBossUpdates"]}
                locale={locale}
              >
                {t.modules.beTheFinalBossUpdates.title}
              </LinkedTitle>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.beTheFinalBossUpdates.intro}
            </p>
          </div>

          <div className="scroll-reveal relative pl-6 md:pl-8 border-l-2 border-[hsl(var(--nav-theme)/0.3)] space-y-6">
            {t.modules.beTheFinalBossUpdates.entries.map(
              (entry: any, index: number) => (
                <div key={index} className="relative">
                  <div className="absolute -left-[1.4rem] md:-left-[1.7rem] w-4 h-4 rounded-full bg-[hsl(var(--nav-theme))] border-2 border-background" />
                  <div className="p-5 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.1)] border border-[hsl(var(--nav-theme)/0.3)] text-[hsl(var(--nav-theme-light))]">
                        <Calendar className="w-3.5 h-3.5" />
                        {entry.date}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${STATUS_STYLES[entry.status] || STATUS_STYLES.default}`}
                      >
                        {entry.status}
                      </span>
                    </div>
                    <h3 className="font-bold mb-2">{entry.title}</h3>
                    <ul className="space-y-1.5">
                      {entry.changes.map((change: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-0.5 flex-shrink-0" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Latest Updates Section */}
      <LatestGuidesAccordion
        articles={latestArticles}
        locale={locale}
        max={12}
      />

      {/* FAQ Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner 3 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.footer.description}
              </p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://www.roblox.com/games/140302982046391/Be-The-Final-Boss"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.roblox}
                  </a>
                </li>
                <li>
                  <a
                    href="https://x.com/ApparentlyGames"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.twitter}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/copyright"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t.footer.copyright}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
