let googleMapsPromise = null;

export function loadGoogleMaps() {
  if (
    window.google &&
    window.google.maps
  ) {
    return Promise.resolve(
      window.google,
    );
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey =
    import.meta.env
      .VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error(
        "Chave da Google Maps JavaScript API não configurada.",
      ),
    );
  }

  googleMapsPromise =
    new Promise(
      (resolve, reject) => {
        const callbackName =
          "__cardapioNota10GoogleMaps";

        window[callbackName] = () => {
          resolve(window.google);

          delete window[
            callbackName
          ];
        };

        const script =
          document.createElement(
            "script",
          );

        script.src =
          "https://maps.googleapis.com/maps/api/js" +
          `?key=${encodeURIComponent(apiKey)}` +
          "&loading=async" +
          "&libraries=geometry" +
          `&callback=${callbackName}`;

        script.async = true;

        script.onerror = () => {
          googleMapsPromise = null;

          reject(
            new Error(
              "Não foi possível carregar o Google Maps.",
            ),
          );
        };

        document.head.appendChild(
          script,
        );
      },
    );

  return googleMapsPromise;
}