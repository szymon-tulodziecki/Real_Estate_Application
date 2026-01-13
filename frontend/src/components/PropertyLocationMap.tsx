import { useMemo } from "react";
import { cn } from "@/lib/utils";

type PropertyLocationMapProps = {
  address?: string | null;
  city?: string | null;
  district?: string | null;
  voivodeship?: string | null;
  postalCode?: string | null;
  className?: string;
  height?: number;
  coordinates?: { lat: number; lng: number } | null;
};

const buildLocationQuery = (parts: Array<string | null | undefined>) => {
  return parts
    .map((value) => (value ? value.trim() : ""))
    .filter(Boolean)
    .join(", ");
};

export const PropertyLocationMap = ({
  address,
  city,
  district,
  voivodeship,
  postalCode,
  className,
  height = 360,
  coordinates = null,
}: PropertyLocationMapProps) => {
  const locationQuery = useMemo(
    () =>
      buildLocationQuery([
        address,
        district,
        city,
        voivodeship,
        postalCode,
      ]),
    [address, city, district, voivodeship, postalCode]
  );

  const hasCoordinates = Boolean(
    coordinates &&
      typeof coordinates.lat === "number" &&
      typeof coordinates.lng === "number"
  );

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const mapSrc = useMemo(() => {
    if (apiKey) {
      if (hasCoordinates && coordinates) {
        return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${coordinates.lat},${coordinates.lng}&zoom=15&maptype=roadmap&language=pl`;
      }
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
        locationQuery
      )}&language=pl`;
    }

    if (hasCoordinates && coordinates) {
      return `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}&hl=pl&z=14&output=embed`;
    }

    return `https://www.google.com/maps?q=${encodeURIComponent(
      locationQuery
    )}&hl=pl&z=14&output=embed`;
  }, [apiKey, coordinates, hasCoordinates, locationQuery]);

  if (!locationQuery && !hasCoordinates) {
    return (
      <div
        className={cn(
          "flex h-48 w-full items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 text-center text-sm text-slate-500",
          className
        )}
      >
        Dokładny adres nie został podany – mapa jest niedostępna.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-3xl border border-slate-200 shadow-sm",
        className
      )}
      style={{ minHeight: height }}
    >
      <iframe
        title="Mapa lokalizacji"
        src={mapSrc}
        className="h-full w-full"
        height={height}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};
