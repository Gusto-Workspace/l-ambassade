import { useContext } from "react";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { GlobalContext } from "@/contexts/global.context";
import RevealOnScrollComponent from "../_shared/motion/reveal-on-scroll.component";
import {
  buildContactInfos,
  buildContactSchedules,
} from "@/_assets/utils/contact.utils";

function groupSchedules(scheduleItems) {
  const usableItems = (scheduleItems || []).filter(
    (item) => item?.hours && item.hours !== "-",
  );

  return usableItems.reduce((groups, item) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.hours === item.hours) {
      lastGroup.days.push(item.day);
      return groups;
    }

    groups.push({ days: [item.day], hours: item.hours });
    return groups;
  }, []);
}

function formatDayRange(days) {
  if (!days?.length) {
    return "";
  }

  return days.length === 1 ? days[0] : `${days[0]} - ${days[days.length - 1]}`;
}

function ScheduleHours({ hours }) {
  const ranges = String(hours || "").split(" • ");

  return (
    <p className="flex flex-wrap justify-end gap-x-1.5 text-right">
      {ranges.map((range, index) => (
        <span key={`${range}-${index}`} className="whitespace-nowrap">
          {index > 0 ? `• ${range}` : range}
        </span>
      ))}
    </p>
  );
}

const itemDecorations = {
  address: "En plein coeur de Montauban.",
  phone: "On vous répond avec plaisir !",
  email: "Écrivez-nous, on vous répond vite.",
};

const iconByKey = {
  address: MapPin,
  phone: Phone,
  email: Mail,
};

export default function HighlightsContactComponent() {
  const { restaurantContext } = useContext(GlobalContext);
  const restaurantData = restaurantContext?.restaurantData;
  const contactInfos = buildContactInfos(restaurantData);
  const scheduleGroups = groupSchedules(buildContactSchedules(restaurantData));

  return (
    <section className="bg-[var(--site-cream)] px-5 py-8 tablet:px-8 tablet:py-10 desktop:px-12 desktop:py-12">
      <RevealOnScrollComponent className="mx-auto max-w-[1680px] rounded-[16px] border border-[rgba(20,72,47,0.14)] bg-[var(--site-cream)] px-5 py-6 shadow-[0_24px_70px_rgba(19,24,20,0.16)] tablet:px-7 tablet:py-7 desktop:px-8 desktop:py-8">
        <div className="grid gap-8 desktop:grid-cols-4 desktop:gap-0">
          {contactInfos.map((item, index) => {
            const Icon = iconByKey[item.key] || MapPin;

            return (
              <div
                key={item.key}
                className={`desktop:px-8 ${
                  index > 0
                    ? "desktop:border-l desktop:border-[rgba(20,72,47,0.14)]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={24}
                    strokeWidth={1.8}
                    className="text-[var(--site-orange-deep)]"
                  />
                  <h2 className="text-[20px] font-extrabold uppercase tracking-[0.04em] text-[var(--site-ink)] tablet:text-[24px]">
                    {item.label}
                  </h2>
                </div>

                {item.href ? (
                  <a
                    href={item.href}
                    className="mt-7 block whitespace-pre-line text-[20px] leading-[1.6] text-[var(--site-ink)] transition hover:text-[var(--site-orange)]"
                  >
                    {String(item.value || "-").replace(/,\s*/g, "\n")}
                  </a>
                ) : (
                  <p className="mt-7 whitespace-pre-line text-[20px] leading-[1.6] text-[var(--site-ink)]">
                    {String(item.value || "-").replace(/,\s*/g, "\n")}
                  </p>
                )}

                <p className="kalam-font mt-8 max-w-[220px] text-[28px] leading-[1.15] text-[var(--site-orange)]">
                  {itemDecorations[item.key]}
                </p>
              </div>
            );
          })}

          <div className="desktop:border-l desktop:border-[rgba(20,72,47,0.14)] desktop:px-8">
            <div className="flex items-center gap-3">
              <Clock3
                size={24}
                strokeWidth={1.8}
                className="text-[var(--site-orange-deep)]"
              />
              <h2 className="text-[20px] font-extrabold uppercase tracking-[0.04em] text-[var(--site-ink)] tablet:text-[24px]">
                Horaires
              </h2>
            </div>

            <div className="mt-6 space-y-3">
              {scheduleGroups.length ? (
                scheduleGroups.map((group) => (
                  <div
                    key={`${group.days[0]}-${group.hours}`}
                    className="grid grid-cols-[1fr_auto] gap-x-6 text-[16px] leading-[1.45] text-[var(--site-ink)]"
                  >
                    <p>{formatDayRange(group.days)}</p>
                    <ScheduleHours hours={group.hours} />
                  </div>
                ))
              ) : (
                <p className="text-[16px] text-[var(--site-ink-soft)]">-</p>
              )}
            </div>
          </div>
        </div>
      </RevealOnScrollComponent>
    </section>
  );
}
