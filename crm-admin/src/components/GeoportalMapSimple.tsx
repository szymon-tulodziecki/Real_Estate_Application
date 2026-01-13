import { useEffect, useRef, useState, useCallback } from "react";

// Deklaracja dla window.ILITEAPI
declare global {
  interface Window {
    ILITEAPI: {
      init: (config: IMapLiteApiConfig, callback?: () => void) => void;
      showMarker: (x: number, y: number, epsg: number, options: Record<string, unknown>) => string;
      deleteMarker: (id: string) => void;
      searchAddress: (query: string, callback: (results: SearchResult[]) => void) => void;
    };
  }
}

interface IMapLiteApiConfig {
  divId: string;
  width: string | number;
  height: string | number;
  activeGpMapId?: string;
  activeGpMaps?: string[];
  activeGpActions?: string[];
  scale?: number;
}

interface SearchResult {
  x: number;
  y: number;
  label: string;
  score?: number;
}

interface Coordinates {
  x: number;
  y: number;
  parcel?: ParcelInfo;
}

interface ParcelInfo {
  id: string;
  address: string;
  geometry?: string;
}

interface GeoportalMapSimpleProps {
  initialCoordinates?: Coordinates;
  address?: string; // Adres z formularza - automatycznie wyszuka lokalizację
  postalCode?: string; // Kod pocztowy - pomaga w wyszukiwaniu
  onCoordinatesSelect?: (coordinates: Coordinates) => void;
  onParcelIdentified?: (parcel: ParcelInfo) => void;
  readOnly?: boolean;
}

export default function GeoportalMapSimple({
  initialCoordinates,
  address,
  postalCode,
  onCoordinatesSelect,
  onParcelIdentified,
  readOnly = false,
}: GeoportalMapSimpleProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<Coordinates | null>(
    initialCoordinates || null
  );
  const [selectedParcel, setSelectedParcel] = useState<ParcelInfo | null>(null);
  const [isIdentifyingParcel, setIsIdentifyingParcel] = useState(false);
  const [isMarkingMode, setIsMarkingMode] = useState(false);
  const mapIdRef = useRef(`map-${Math.random().toString(36).substr(2, 11)}`);
  const currentMarkerIdRef = useRef<string>("");
  const isInitializedRef = useRef(false);

  // Ładowanie skryptu iMapLite
  const loadIMapLiteScript = () =>
    new Promise<void>((resolve, reject) => {
      if (window.ILITEAPI) {
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://mapy.geoportal.gov.pl/iMapLite/js/imapLiteApi-core.js";
      script.type = "text/javascript";
      script.onload = () => setTimeout(resolve, 500);
      script.onerror = () => reject(new Error("Nie udało się wczytać skryptu iMapLiteApi"));
      document.head.appendChild(script);
    });

  const isApiReady = (): boolean =>
    !!(
      window.ILITEAPI &&
      typeof window.ILITEAPI.init === "function" &&
      typeof window.ILITEAPI.showMarker === "function"
    );

  // Identyfikacja działki przez ULDK API
  const identifyParcel = async (x: number, y: number): Promise<ParcelInfo | null> => {
    try {
      const response = await fetch(
        `https://uldk.gugik.gov.pl/?request=GetParcelByXY&xy=${x},${y}&result=geom_wkt,id,voivodeship,county,commune,region,parcel`
      );
      if (!response.ok) return null;
      const text = await response.text();
      const lines = text.trim().split("\n");
      if (lines.length < 2) return null;
      const data = lines[1].split("|");
      if (data.length < 7) return null;
      const [, id, voivodeship, county, commune, region, parcel] = data;
      const geometry = data.join(';');
      if (!id || id === "-") return null;
      return {
        id: `${voivodeship}.${county}.${commune}.${region}.${parcel}`,
        address: `${voivodeship}, ${county}, ${commune}`,
        geometry,
      };
    } catch (error) {
      console.error("Error identifying parcel:", error);
      return null;
    }
  };

  // Obsługa wyboru lokalizacji z dokładnymi współrzędnymi
  const handleLocationSelect = useCallback(
    async (x: number, y: number, locationName?: string) => {
      if (readOnly || !window.ILITEAPI) {
        return;
      }
      try {
        setIsIdentifyingParcel(true);
        console.log(`Wybrano lokalizację: ${locationName || 'Custom'} (${x}, ${y})`);
        
        // Usuń poprzedni marker jeśli istnieje
        if (currentMarkerIdRef.current) {
          window.ILITEAPI.deleteMarker(currentMarkerIdRef.current);
          currentMarkerIdRef.current = "";
        }
        
        // Pokaż marker
        const markerId = window.ILITEAPI.showMarker(x, y, 2180, {
          title: locationName || "Wybrana lokalizacja",
          content: `<div style="padding:12px;font-family:sans-serif;min-width:200px;">
            <h4 style="margin:0;color:#00558b;font-size:14px;">${locationName || "Lokalizacja"}</h4>
            <p style="margin:8px 0 0 0;font-size:11px;color:#666;">X: ${x.toFixed(2)}<br/>Y: ${y.toFixed(2)}</p>
          </div>`,
          id: "location-marker",
        });
        currentMarkerIdRef.current = markerId;

        const coordinates: Coordinates = { x, y };
        setSelectedCoordinates(coordinates);
        onCoordinatesSelect?.(coordinates);

        // Sprawdź działkę
        const parcelData = await identifyParcel(x, y);
        if (parcelData) {
          setSelectedParcel(parcelData);
          coordinates.parcel = parcelData;
          onParcelIdentified?.(parcelData);
          if (currentMarkerIdRef.current) {
            window.ILITEAPI.deleteMarker(currentMarkerIdRef.current);
          }
          const updatedMarkerId = window.ILITEAPI.showMarker(x, y, 2180, {
            title: `Działka ${parcelData.id}`,
            content: `<div style="padding:20px;font-family:sans-serif;min-width:350px;max-width:400px;">
                <h3 style="margin:0 0 15px 0;color:#059669;font-size:18px;font-weight:bold;">Działka zidentyfikowana</h3>
                <div style="background:#ecfdf5;padding:15px;margin:0 0 15px 0;border-radius:8px;border-left:4px solid #059669;">
                  <p style="margin:0 0 8px 0;font-size:12px;font-weight:600;color:#065f46;">Identyfikator działki:</p>
                  <p style="margin:0 0 12px 0;font-size:14px;color:#047857;font-family:monospace;word-break:break-all;background:#f0fdf4;padding:8px;border-radius:4px;">${parcelData.id}</p>
                  <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#065f46;">Adres:</p>
                  <p style="margin:0;font-size:13px;color:#047857;line-height:1.4;">${parcelData.address}</p>
                </div>
                <div style="background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">
                  <p style="margin:0 0 4px 0;font-size:10px;color:#64748b;font-weight:600;">Współrzędne PUWG 1992:</p>
                  <p style="margin:0;font-size:11px;color:#475569;font-family:monospace;">X: ${x.toFixed(2)} | Y: ${y.toFixed(2)}</p>
                </div>
              </div>`,
            id: "parcel-marker",
          });
          currentMarkerIdRef.current = updatedMarkerId;
        } else {
          setSelectedParcel(null);
        }
      } catch (error) {
        setError("Błąd podczas ustawiania markera");
        console.error("Location select error:", error);
      } finally {
        setIsIdentifyingParcel(false);
        setIsMarkingMode(false);
      }
    },
    [onCoordinatesSelect, onParcelIdentified, readOnly]
  );

  // Obsługa kliknięcia na mapę (fallback gdy nie ma auto-wyszukiwania)
  const handleMapClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (readOnly || !isMarkingMode) return;
      
      const rect = event.currentTarget.getBoundingClientRect();
      const pixelX = event.clientX - rect.left;
      const pixelY = event.clientY - rect.top;

      console.log('Map click:', { pixelX, pixelY, rectWidth: rect.width, rectHeight: rect.height });

      // Prosta konwersja pixel → współrzędne (centrum Polska)
      const centerX = 650000; // Środek Polski X
      const centerY = 450000; // Środek Polski Y  
      const mapWidthInMeters = 10000; // 10km obszar (konserwatywnie)
      const mapHeightInMeters = 10000;
      
      const metersPerPixelX = mapWidthInMeters / rect.width;
      const metersPerPixelY = mapHeightInMeters / rect.height;
      
      const mapX = centerX + (pixelX - rect.width / 2) * metersPerPixelX;
      const mapY = centerY + (rect.height / 2 - pixelY) * metersPerPixelY;

      console.log('Calculated coordinates:', { mapX, mapY, metersPerPixelX, metersPerPixelY });

      handleLocationSelect(mapX, mapY, 'Oznaczona lokalizacja');
    },
    [readOnly, isMarkingMode, handleLocationSelect]
  );

  // Inicjalizacja mapy
  useEffect(() => {
    if (isInitializedRef.current || !mapContainer.current) return;
    isInitializedRef.current = true;
    const mapElement = mapContainer.current;
    mapElement.id = mapIdRef.current;
    
    const initMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadIMapLiteScript();
        let attempts = 0;
        while (!isApiReady() && attempts < 20) {
          await new Promise((r) => setTimeout(r, 250));
          attempts++;
        }
        if (!isApiReady()) {
          throw new Error("iMapLiteApi nie jest dostępne po załadowaniu");
        }
        
        const config: IMapLiteApiConfig = {
          divId: mapElement.id,
          width: "100%",
          height: 500,
          activeGpMapId: "gp1",
          activeGpMaps: ["gp0", "gp1"],
          activeGpActions: ["pan", "fullExtent", "zoomIn", "zoomOut"],
          scale: 100000,
        };
        window.ILITEAPI.init(config);
      } catch (err) {
        setError(
          `Błąd inicjalizacji mapy: ${err instanceof Error ? err.message : "Nieznany błąd"}`
        );
      } finally {
        setIsLoading(false);
      }
    };
    initMap();
  }, []);

  // Automatyczne wyszukiwanie adresu po załadowaniu mapy
  useEffect(() => {
    if ((address || postalCode) && !initialCoordinates && window.ILITEAPI?.searchAddress && !selectedCoordinates) {
      // Buduj query z adresu i kodu pocztowego
      let searchQuery = '';
      if (address && postalCode) {
        searchQuery = `${address}, ${postalCode}`;
      } else if (address) {
        searchQuery = address;
      } else if (postalCode) {
        searchQuery = postalCode;
      }
      
      console.log('Auto-searching address:', searchQuery);
      setIsIdentifyingParcel(true);
      
      window.ILITEAPI.searchAddress(searchQuery, (results: SearchResult[]) => {
        console.log('Auto-search results:', results);
        if (results && results.length > 0) {
          const bestResult = results[0]; // Weź pierwszy (najlepszy) wynik
          handleLocationSelect(bestResult.x, bestResult.y, bestResult.label);
        } else {
          setIsIdentifyingParcel(false);
          console.log('No results found for query:', searchQuery);
        }
      });
    }
  }, [address, postalCode, initialCoordinates, selectedCoordinates, handleLocationSelect]);

  // Ustaw początkowe współrzędne
  useEffect(() => {
    if (initialCoordinates && window.ILITEAPI && !currentMarkerIdRef.current) {
      const { x, y, parcel } = initialCoordinates;
      const content = parcel
        ? `<div><h4>Działka ${parcel.id}</h4><p>${parcel.address}</p></div>`
        : `<div><h4>Wybrana lokalizacja</h4><p>X: ${x.toFixed(2)}, Y: ${y.toFixed(2)}</p></div>`;
      const markerId = window.ILITEAPI.showMarker(x, y, 2180, {
        title: parcel ? `Działka ${parcel.id}` : "Wybrana lokalizacja",
        content,
        id: "initial-marker",
      });
      currentMarkerIdRef.current = markerId;
      setSelectedParcel(parcel || null);
    }
  }, [initialCoordinates]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          ref={mapContainer}
          className="w-full border border-gray-300 rounded-lg bg-gray-100"
          style={{ height: "500px", minHeight: "500px" }}
          title="Mapa Geoportalu"
        />

        {/* Overlay do klikania na mapę (tylko w trybie oznaczania) */}
        {!readOnly && isMarkingMode && (
          <div
            className="absolute inset-0 cursor-crosshair"
            style={{ 
              zIndex: 1000, 
              pointerEvents: 'auto',
              background: 'rgba(59, 130, 246, 0.1)' // Lekki niebieski overlay
            }}
            onClick={handleMapClick}
            onWheel={(e) => {
              // Przepuść wheel events do mapy poniżej
              e.stopPropagation();
              const mapElement = document.getElementById(mapIdRef.current);
              if (mapElement) {
                mapElement.dispatchEvent(new WheelEvent('wheel', {
                  deltaX: e.deltaX,
                  deltaY: e.deltaY,
                  bubbles: true
                }));
              }
            }}
            title="Kliknij aby oznaczyć lokalizację działki"
          >
            {/* Wizualna ramka trybu oznaczania */}
            <div
              className="absolute inset-0 border-4 border-blue-500 border-dashed rounded-lg pointer-events-none"
              style={{ zIndex: 999 }}
            />
            
            {/* Info panel */}
            <div className="absolute top-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg pointer-events-auto">
              <p className="mb-1">🎯 Kliknij na mapie aby oznaczyć działkę</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMarkingMode(false);
                }}
                className="text-xs bg-white text-blue-600 px-2 py-1 rounded hover:bg-gray-100"
              >
                Anuluj
              </button>
            </div>
          </div>
        )}

        {/* Loader */}
        {(isLoading || isIdentifyingParcel) && (
          <div className="absolute inset-0 bg-gray-100 bg-opacity-80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-700">
                {isLoading ? "Trwa ładowanie mapy..." : "Wyszukiwanie działki..."}
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center rounded-lg">
            <div className="text-center p-4">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Przycisk do ręcznego oznaczania (gdy nie ma adresu lub nie znaleziono) */}
      {!readOnly && !selectedCoordinates && !isMarkingMode && (
        <div className="text-center">
          <button
            onClick={() => setIsMarkingMode(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg transition-colors"
          >
            {address || postalCode ? "Oznacz działkę ręcznie" : "Oznacz działkę na mapie"}
          </button>
          <p className="text-sm text-gray-600 mt-2">
            {address || postalCode
              ? (() => {
                  const searchTerm = address && postalCode 
                    ? `${address}, ${postalCode}` 
                    : address || postalCode;
                  return `Nie znaleziono automatycznie "${searchTerm}". Kliknij przycisk i wskaż miejsce na mapie.`;
                })()
              : "Kliknij przycisk, a następnie wskaż miejsce działki na mapie"
            }
          </p>
        </div>
      )}

      {/* Informacje o wyborze - WIĘKSZE OKNO */}
      {selectedCoordinates && (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {selectedParcel ? `Działka: ${selectedParcel.id}` : "Wybrana lokalizacja"}
              </h3>
              
              {selectedParcel && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">Działka została zidentyfikowana</p>
                      <p className="text-sm text-green-600 mt-1">{selectedParcel.address}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Współrzędne PUWG 1992:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Współrzędna X:</p>
                    <p className="text-lg font-mono text-gray-800">{selectedCoordinates.x.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Współrzędna Y:</p>
                    <p className="text-lg font-mono text-gray-800">{selectedCoordinates.y.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {!readOnly && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsMarkingMode(true)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
                >
                  Zmień lokalizację
                </button>
                <button
                  onClick={() => {
                    if (currentMarkerIdRef.current) {
                      window.ILITEAPI?.deleteMarker(currentMarkerIdRef.current);
                      currentMarkerIdRef.current = "";
                    }
                    setSelectedCoordinates(null);
                    setSelectedParcel(null);
                    onCoordinatesSelect?.({ x: 0, y: 0 });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium"
                >
                  Wyczyść
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}