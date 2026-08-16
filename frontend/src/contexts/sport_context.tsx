// frontend/src/contexts/sport_context.tsx
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { apiFetch } from "@/api/client";
import { devLog } from "@/utils/dev_log";

const __DEV__ = import.meta.env.DEV;
export type Sport = "NBA" | "MLB" | "NFL";

interface SportContextValue {
  sport: Sport;
  setSport: (s: Sport) => void;
  /** true while selecting the preferred sport for a given date */
  isResolving: boolean;
  /**
   * Pick a sport for the given ET date ("YYYY-MM-DD") without triggering any
   * heavy schedule fetches. Priority: NFL, then NBA, then MLB.
   *
   * **Only ever a default.** Once the reader has chosen a sport from the
   * header this does nothing, so a date change cannot take their choice
   * away — see the note on the route effect below.
   */
  initSportForDate: (dateYmd: string) => Promise<void>;
}

const SportContext = createContext<SportContextValue | undefined>(undefined);

export const SportProvider = ({ children }: { children: React.ReactNode }) => {
  /**
   * The sport is the reader's choice and it survives navigation.
   *
   * There used to be a route effect here that reset it on every move to
   * Games or Stats. It ran `setSport((prev) => (prev === "NBA" ? prev :
   * "NBA"))` in *both* of its branches, so both resolved to NBA, while
   * the comments above it described two different behaviours — "/stats →
   * NFL always" and "/games → MLB baseline". Pick NFL on Games, open
   * Stats, come back, and you were on NBA. In August that is a sport with
   * no games, so the screen you returned to was empty.
   *
   * It is gone rather than corrected, because every version of it was
   * wrong. The switcher lives in the header, which is app chrome present
   * on every screen (§6.6) — a control in persistent chrome that resets
   * when you change screen is broken by construction. It also made the
   * guided tour's first step untrue: "Switch between MLB, NBA and NFL
   * here" is step 1, and the next navigation undid it (defect 74).
   *
   * Nothing needed a per-route sport. Stats renders for all three, and a
   * sport with no games on a date gets the designed empty state (§6.9)
   * rather than a silent substitution.
   *
   * The initial value is only what the app shows before `initSportForDate`
   * has answered. A reader who deep-links to Stats never runs that, so
   * they land here — the same sport the old effect forced them to.
   */
  const [sport, setSportState] = useState<Sport>("NBA");
  const [isResolving, setIsResolving] = useState(false);
  const resolvingRef = useRef(false);
  const lastDateRef = useRef<string | null>(null);

  /* Whether the reader has picked a sport themselves. Once they have, the
   * availability resolver stops overriding them — otherwise the same
   * complaint just moves from "changing screen loses my sport" to
   * "changing date loses my sport". */
  const chosenRef = useRef(false);

  const setSport = useCallback((next: Sport) => {
    chosenRef.current = true;
    setSportState(next);
  }, []);

  const initSportForDate = useCallback(
    async (dateYmd: string) => {
      if (!dateYmd) return;
      if (lastDateRef.current === dateYmd) return; // already decided for this day
      if (resolvingRef.current) return; // prevent overlaps
      if (chosenRef.current) {
        // The reader has chosen. Record the date so this does not retry,
        // and leave the choice alone.
        lastDateRef.current = dateYmd;
        return;
      }
      resolvingRef.current = true;
      setIsResolving(true);
      try {
        // Tiny, cached endpoint (fast). If it fails, keep the current sport.
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 5000);

        // Quick trace for path + date
        devLog("[availability] requesting for", dateYmd);
        const res = await apiFetch(
          `api/v1/availability?date=${encodeURIComponent(dateYmd)}`,
          {
            signal: ctrl.signal,
            cache: "no-store",
            headers: { accept: "application/json" },
          },
        );

        clearTimeout(tid);
        devLog("[availability] response", {
          status: res.status,
          ok: res.ok,
          url: res.url,
        });

        if (!res.ok) {
          if (__DEV__) {
            try {
              const text = await res.text();
              devLog(
                "[availability] non-OK body snippet:",
                text.slice(0, 200),
              );
            } catch {
              devLog("[availability] non-OK, failed to read body");
            }
          }
          setIsResolving(false);
          return;
        }

        const json = (await res.json()) as {
          NFL?: boolean;
          MLB?: boolean;
          NBA?: boolean;
        };
        devLog("[availability] payload", json);

        // Priority: NFL → NBA → MLB
        // Only change when needed to avoid re-renders/flicker
        /* Priority NFL → NBA → MLB. Written through the raw setter, not
         * `setSport`, because resolving a default is not the reader
         * choosing — going through `setSport` would mark it as chosen and
         * stop every later date from being resolved. */
        const preferred: Sport = json.NFL ? "NFL" : json.NBA ? "NBA" : "MLB";
        setSportState((prev) => {
          if (prev === preferred) {
            devLog(`[availability] keeping sport as ${prev}`);
            return prev;
          }
          devLog(`[availability] switching sport → ${preferred}`);
          return preferred;
        });

        lastDateRef.current = dateYmd;
      } catch {
        // Silent fallback: keep the current sport, maintain performance
      } finally {
        resolvingRef.current = false;
        setIsResolving(false);
        devLog("[availability] done", { lastDate: lastDateRef.current });
      }
    },
    [],
  );

  return (
    <SportContext.Provider
      value={{ sport, setSport, isResolving, initSportForDate }}
    >
      {children}
    </SportContext.Provider>
  );
};

export const useSport = (): SportContextValue => {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error("useSport must be used inside <SportProvider>");
  return ctx;
};
