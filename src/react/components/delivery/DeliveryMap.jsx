import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import "../../styles/DeliveryMap.css";

import {
  loadGoogleMaps,
} from "../../services/googleMapsService.js";

export function DeliveryMap({
  origin,
  destination,
  encodedPolyline,
  distanceKm,
  durationMinutes,
}) {
  const mapElementRef =
    useRef(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function initializeMap() {
      try {
        setLoading(true);
        setError("");

        const originLatitude =
          Number(origin?.latitude);

        const originLongitude =
          Number(origin?.longitude);

        const destinationLatitude =
          Number(
            destination?.latitude,
          );

        const destinationLongitude =
          Number(
            destination?.longitude,
          );

        if (
          !Number.isFinite(
            originLatitude,
          ) ||
          !Number.isFinite(
            originLongitude,
          ) ||
          !Number.isFinite(
            destinationLatitude,
          ) ||
          !Number.isFinite(
            destinationLongitude,
          )
        ) {
          throw new Error(
            "Coordenadas da entrega inválidas.",
          );
        }

        const google =
          await loadGoogleMaps();

        if (
          !active ||
          !mapElementRef.current
        ) {
          return;
        }

        const originPosition = {
          lat: originLatitude,
          lng: originLongitude,
        };

        const destinationPosition = {
          lat:
            destinationLatitude,

          lng:
            destinationLongitude,
        };

        const map =
          new google.maps.Map(
            mapElementRef.current,
            {
              center:
                originPosition,

              zoom: 14,

              mapTypeControl:
                false,

              streetViewControl:
                false,

              fullscreenControl:
                true,
            },
          );

        /*
         * Marcador do estabelecimento.
         */
        new google.maps.Marker({
          map,
          position:
            originPosition,

          title:
            "Estabelecimento",

          label: "E",
        });

        /*
         * Marcador do cliente.
         */
        new google.maps.Marker({
          map,
          position:
            destinationPosition,

          title:
            "Cliente",

          label: "C",
        });

        const bounds =
          new google.maps.LatLngBounds();

        bounds.extend(
          originPosition,
        );

        bounds.extend(
          destinationPosition,
        );

        /*
         * Desenha a rota retornada
         * pela Routes API.
         */
        if (encodedPolyline) {
          const path =
            google.maps.geometry
              .encoding
              .decodePath(
                encodedPolyline,
              );

          const routePolyline =
            new google.maps.Polyline({
              path,

              geodesic: true,

              strokeOpacity: 0.9,

              strokeWeight: 5,

              map,
            });

          routePolyline
            .getPath()
            .forEach(
              (position) => {
                bounds.extend(
                  position,
                );
              },
            );
        }

        map.fitBounds(bounds, {
            top: 40,
            right: 40,
            bottom: 40,
            left: 40,
            });

            google.maps.event.addListenerOnce(
                map,
                "idle",
                () => {
                    const currentZoom =
                    map.getZoom();

                    if (
                    typeof currentZoom ===
                        "number" &&
                    currentZoom > 16
                    ) {
                    map.setZoom(16);
                    }
                },
            );
        if (active) {
          setLoading(false);
        }
      } catch (mapError) {
        console.error(
          "Erro ao carregar mapa:",
          mapError,
        );

        if (active) {
          setError(
            mapError.message ||
              "Não foi possível carregar o mapa.",
          );

          setLoading(false);
        }
      }
    }

    initializeMap();

    return () => {
      active = false;
    };
  }, [
    origin,
    destination,
    encodedPolyline,
  ]);

  return (
    <section className="delivery-map">
      <div className="delivery-map__summary">
        <div>
          <span>Distância</span>

          <strong>
            {Number(
              distanceKm || 0,
            ).toFixed(1)}
            {" km"}
          </strong>
        </div>

        <div>
          <span>
            Tempo estimado
          </span>

          <strong>
            {Number(
              durationMinutes || 0,
            )}
            {" min"}
          </strong>
        </div>
      </div>

      <div className="delivery-map__container">
        {loading && (
          <div className="delivery-map__loading">
            Carregando mapa...
          </div>
        )}

        {error && (
          <div className="delivery-map__error">
            {error}
          </div>
        )}

        <div
          ref={mapElementRef}
          className="delivery-map__map"
        />
      </div>
    </section>
  );
}