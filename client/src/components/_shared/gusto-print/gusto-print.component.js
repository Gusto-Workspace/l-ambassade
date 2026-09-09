import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

const GUSTO_PRINT_PAGE_STYLE = {
  "--gusto-print-page-width": "210mm",
  "--gusto-print-page-height": "297mm",
  "--gusto-print-margin-block": "10mm",
  "--gusto-print-margin-inline": "12mm",
};
const GUSTO_MANAGER_ORIGIN = "https://gusto-manager.com";
const GUSTO_RETURN_PATH = /^\/(?:en\/|fr\/)?dashboard\/(?:dishes|menus)\/?$/;

function getSafeGustoReturnUrl(value) {
  if (typeof value !== "string" || !value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.origin !== GUSTO_MANAGER_ORIGIN) return null;
    if (url.username || url.password) return null;
    if (!GUSTO_RETURN_PATH.test(url.pathname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function useGustoPrintMode() {
  const router = useRouter();
  return {
    printMode: router.isReady && router.query.gustoPrint === "1",
    autoPrint: router.isReady && router.query.autoprint === "1",
  };
}
export function hasPrintableMenuContent(restaurant) {
  return (
    (restaurant?.dish_categories || []).some(
      (category) =>
        category?.visible &&
        ((category?.dishes || []).some((dish) => dish?.showOnWebsite) ||
          (category?.subCategories || []).some(
            (subCategory) =>
              subCategory?.visible !== false &&
              (subCategory?.dishes || []).some((dish) => dish?.showOnWebsite),
          )),
    ) || (restaurant?.menus || []).some((menu) => menu?.visible !== false)
  );
}
export default function GustoPrintComponent({
  autoPrint,
  restaurant,
  dataLoading,
  dataError,
  children,
}) {
  const router = useRouter();
  const triggered = useRef(false);
  const ready = !dataLoading && Boolean(restaurant) && !dataError;
  const hasContent = ready && hasPrintableMenuContent(restaurant);
  const gustoReturnUrl = getSafeGustoReturnUrl(router.query.gustoReturn);
  useEffect(() => {
    if (!autoPrint || !ready || !hasContent || triggered.current)
      return undefined;
    triggered.current = true;
    let cancelled = false;
    const run = async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      if (cancelled) return;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!cancelled) window.print();
        }),
      );
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [autoPrint, hasContent, ready]);
  return (
    <>
      <Head>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main
        className="gusto-print-mode"
        style={GUSTO_PRINT_PAGE_STYLE}
        data-gusto-print-ready={ready && hasContent ? "true" : "false"}
      >
        <div className="gusto-print-toolbar" data-gusto-no-print>
          <span>{restaurant?.name || "Carte & menus"}</span>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!hasContent}
          >
            Imprimer
          </button>
          {gustoReturnUrl ? (
            <button
              type="button"
              onClick={() => window.location.replace(gustoReturnUrl)}
            >
              Retour à Gusto
            </button>
          ) : null}
        </div>
        {dataLoading ? (
          <p className="gusto-print-status">Chargement de la carte…</p>
        ) : dataError ? (
          <p className="gusto-print-status">Impossible de charger la carte.</p>
        ) : !hasContent ? (
          <div className="gusto-print-status">
            <p>La carte ne contient actuellement aucun plat ou menu publié.</p>
            {gustoReturnUrl ? (
              <button
                type="button"
                onClick={() => window.location.replace(gustoReturnUrl)}
                data-gusto-no-print
              >
                Retour à Gusto
              </button>
            ) : null}
          </div>
        ) : (
          children
        )}
      </main>
    </>
  );
}
