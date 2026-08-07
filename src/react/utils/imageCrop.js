export async function createCroppedImage({
  imageSource,
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
  outputSize = 256,
  mimeType = "image/webp",
  quality = 0.9,
}) {
  if (!imageSource) {
    throw new Error("Imagem não informada.");
  }

  const image = await loadImage(imageSource);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "Não foi possível processar a imagem.",
    );
  }

  canvas.width = outputSize;
  canvas.height = outputSize;

  const sourceSize = Math.min(
    image.naturalWidth,
    image.naturalHeight,
  );

  const visibleSourceSize =
    sourceSize / Math.max(zoom, 1);

  const maxSourceX =
    image.naturalWidth - visibleSourceSize;

  const maxSourceY =
    image.naturalHeight - visibleSourceSize;

  const normalizedX =
    Math.min(
      Math.max((offsetX + 100) / 200, 0),
      1,
    );

  const normalizedY =
    Math.min(
      Math.max((offsetY + 100) / 200, 0),
      1,
    );

  const sourceX =
    maxSourceX * normalizedX;

  const sourceY =
    maxSourceY * normalizedY;

  context.clearRect(
    0,
    0,
    outputSize,
    outputSize,
  );

  context.drawImage(
    image,
    sourceX,
    sourceY,
    visibleSourceSize,
    visibleSourceSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  const blob = await new Promise(
    (resolve, reject) => {
      canvas.toBlob(
        (generatedBlob) => {
          if (!generatedBlob) {
            reject(
              new Error(
                "Não foi possível gerar a imagem.",
              ),
            );

            return;
          }

          resolve(generatedBlob);
        },
        mimeType,
        quality,
      );
    },
  );

  return new File(
    [blob],
    `logo-${Date.now()}.webp`,
    {
      type: mimeType,
    },
  );
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);

    image.onerror = () => {
      reject(
        new Error(
          "Não foi possível carregar a imagem.",
        ),
      );
    };

    image.src = source;
  });
}