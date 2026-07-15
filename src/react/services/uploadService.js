import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from "firebase/storage";

import {
  storage,
} from "../firebase/firebaseConfig.js";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_ORIGINAL_SIZE = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1200;
const IMAGE_QUALITY = 0.82;

function validateImage(file) {
  if (!(file instanceof File)) {
    throw new Error("Selecione uma imagem.");
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      "Use uma imagem JPG, PNG ou WebP.",
    );
  }

  if (file.size > MAX_ORIGINAL_SIZE) {
    throw new Error(
      "A imagem deve ter no máximo 5 MB.",
    );
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error(
          "Não foi possível processar a imagem.",
        ),
      );
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas,
  type = "image/webp",
  quality = IMAGE_QUALITY,
) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(
            new Error(
              "Não foi possível comprimir a imagem.",
            ),
          );

          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function compressImage(file) {
  validateImage(file);

  const image = await loadImage(file);

  const largestDimension = Math.max(
    image.width,
    image.height,
  );

  const scale =
    largestDimension > MAX_IMAGE_DIMENSION
      ? MAX_IMAGE_DIMENSION / largestDimension
      : 1;

  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error(
      "O navegador não conseguiu processar a imagem.",
    );
  }

  context.drawImage(
    image,
    0,
    0,
    width,
    height,
  );

  return canvasToBlob(canvas);
}

export async function uploadProductImage({
  establishmentId,
  productId,
  file,
  onProgress,
}) {
  if (!establishmentId || !productId) {
    throw new Error(
      "Estabelecimento ou produto inválido.",
    );
  }

  const compressedImage =
    await compressImage(file);

  const imagePath =
    `establishments/${establishmentId}` +
    `/products/${productId}/main.webp`;

  const imageReference = ref(
    storage,
    imagePath,
  );

  const uploadTask = uploadBytesResumable(
    imageReference,
    compressedImage,
    {
      contentType: "image/webp",

      customMetadata: {
        establishmentId,
        productId,
      },
    },
  );

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",

      (snapshot) => {
        const progress = Math.round(
          (
            snapshot.bytesTransferred /
            snapshot.totalBytes
          ) * 100,
        );

        onProgress?.(progress);
      },

      (error) => {
        console.error(
          "Erro no upload da imagem:",
          error,
        );

        reject(
          new Error(
            "Não foi possível enviar a foto.",
          ),
        );
      },

      async () => {
        try {
          const fotoUrl =
            await getDownloadURL(
              uploadTask.snapshot.ref,
            );

          resolve({
            fotoUrl,
            fotoPath: imagePath,
          });
        } catch (error) {
          reject(error);
        }
      },
    );
  });
}

export async function deleteProductImage(
  fotoPath,
) {
  if (!fotoPath) return;

  const imageReference = ref(
    storage,
    fotoPath,
  );

  try {
    await deleteObject(imageReference);
  } catch (error) {
    if (
      error?.code !==
      "storage/object-not-found"
    ) {
      throw error;
    }
  }
}