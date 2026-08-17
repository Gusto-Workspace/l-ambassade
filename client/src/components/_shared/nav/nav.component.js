import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext, useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { GlobalContext } from "@/contexts/global.context";
import { hasVisibleNews } from "@/_assets/utils/news.utils";

const baseMenuItems = [
  { label: "Accueil", href: "/" },
  { label: "Carte & menus", href: "/menus" },
  { label: "Actualités", href: "/news", visibilityKey: "news" },
  { label: "Contact", href: "/contact" },
];
let hasAssignedInitialNavReveal = false;

function isCurrentPath(pathname, href) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Brand() {
  return (
    <span className="ambassade-brand">
      <span className="ambassade-brand__mark">
        <Image
          src="/img/_shared/logo-bg-transparent.webp"
          alt=""
          fill
          priority
          sizes="56px"
          className="object-contain"
        />
      </span>
      <span className="ambassade-brand__words">
        <strong>L’Ambassade</strong>
        <small>Restaurant · Bar · Lounge</small>
      </span>
    </span>
  );
}

export default function NavComponent({ isVisible = true, scrolled = false }) {
  const router = useRouter();
  const { restaurantContext } = useContext(GlobalContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [shouldAnimateInitialReveal] = useState(!hasAssignedInitialNavReveal);
  const [hasStartedNewsVisibilityCheck, setHasStartedNewsVisibilityCheck] = useState(false);
  const [newsVisibilityResolved, setNewsVisibilityResolved] = useState(hasAssignedInitialNavReveal);
  const [navReady, setNavReady] = useState(hasAssignedInitialNavReveal);
  const [animateOnMount, setAnimateOnMount] = useState(false);
  const [mountReady, setMountReady] = useState(hasAssignedInitialNavReveal);
  const [visibilityTransitionsEnabled, setVisibilityTransitionsEnabled] = useState(hasAssignedInitialNavReveal);
  const restaurantData = restaurantContext?.restaurantData;
  const restaurantDataLoading = restaurantContext?.dataLoading;
  const menuItems = useMemo(() => baseMenuItems.filter((item) => item.visibilityKey !== "news" || (newsVisibilityResolved && hasVisibleNews(restaurantData))), [newsVisibilityResolved, restaurantData]);

  useEffect(() => {
    if (isVisible && !hasAssignedInitialNavReveal) {
      hasAssignedInitialNavReveal = true;
      setAnimateOnMount(true);
    }
  }, [isVisible]);

  useEffect(() => {
    if (restaurantDataLoading || restaurantData) setHasStartedNewsVisibilityCheck(true);
  }, [restaurantData, restaurantDataLoading]);

  useEffect(() => {
    if (newsVisibilityResolved) return undefined;
    if (restaurantData || (hasStartedNewsVisibilityCheck && !restaurantDataLoading)) {
      const frame = window.requestAnimationFrame(() => {
        setNewsVisibilityResolved(true);
        setNavReady(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }
    const fallback = window.setTimeout(() => {
      setNewsVisibilityResolved(true);
      setNavReady(true);
    }, 500);
    return () => window.clearTimeout(fallback);
  }, [hasStartedNewsVisibilityCheck, newsVisibilityResolved, restaurantData, restaurantDataLoading]);

  useEffect(() => {
    if (!shouldAnimateInitialReveal || !navReady) return undefined;
    let firstFrame;
    let secondFrame;
    if (animateOnMount) {
      setVisibilityTransitionsEnabled(true);
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => setMountReady(true));
      });
    } else {
      setMountReady(true);
      firstFrame = window.requestAnimationFrame(() => setVisibilityTransitionsEnabled(true));
    }
    return () => {
      if (firstFrame) window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [animateOnMount, navReady, shouldAnimateInitialReveal]);

  useEffect(() => {
    setMenuOpen(false);
  }, [router.asPath]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header
        className={`ambassade-nav${scrolled ? " ambassade-nav--scrolled" : ""}${
          navReady && mountReady && isVisible ? "" : " ambassade-nav--hidden"
        }${visibilityTransitionsEnabled ? " ambassade-nav--reveal-transition" : " ambassade-nav--no-transition"}`}
      >
        <div className="ambassade-nav__inner">
          <Link href="/" aria-label="Accueil — L’Ambassade">
            <Brand />
          </Link>

          <nav className="ambassade-nav__desktop" aria-label="Navigation principale">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrentPath(router.pathname, item.href) ? "page" : undefined}
                className={isCurrentPath(router.pathname, item.href) ? "is-active" : ""}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/reservations" className="ambassade-nav__booking">
              Réserver
            </Link>
          </nav>

          <button
            type="button"
            className="ambassade-nav__toggle"
            aria-label="Ouvrir le menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={24} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      <aside
        id="mobile-navigation"
        className={`ambassade-mobile-nav${menuOpen ? " is-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="ambassade-mobile-nav__top">
          <Link href="/" aria-label="Accueil — L’Ambassade">
            <Brand />
          </Link>
          <button type="button" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)}>
            <X size={26} strokeWidth={1.4} />
          </button>
        </div>

        <nav aria-label="Navigation mobile">
          {menuItems.map((item, index) => (
            <Link key={item.href} href={item.href} tabIndex={menuOpen ? 0 : -1}>
              <small>0{index + 1}</small>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <Link
          href="/reservations"
          className="ambassade-button ambassade-button--copper"
          tabIndex={menuOpen ? 0 : -1}
        >
          Réserver une table
        </Link>
      </aside>
    </>
  );
}
