import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import {
  deleteProductImage,
  uploadProductImage,
} from "./uploadService.js";

import { db } from "../firebase/firebaseConfig.js";

function productsCollection(establishmentId) {
  return collection(
    db,
    "establishments",
    establishmentId,
    "products",
  );
}

export function observeProducts(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange([]);
    return () => {};
  }

  const productsQuery = query(
    productsCollection(establishmentId),
    orderBy("ordem", "asc"),
  );

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      const products = snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data(),
        }),
      );

      onChange(products);
    },
    (error) => {
      console.error(
        "Erro ao carregar produtos:",
        error,
      );

      onError?.(error);
    },
  );
}

export async function createProduct({
  establishmentId,
  nome,
  descricao,
  preco,
  categoriaId,
  emoji = "🍽️",
  foto = null,
  onUploadProgress,
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  const normalizedName =
    String(nome || "").trim();

  const normalizedDescription =
    String(descricao || "").trim();

  const normalizedCategoryId =
    String(categoriaId || "").trim();

  const normalizedPrice = Number(
    String(preco)
      .replace(/\./g, "")
      .replace(",", "."),
  );

  if (!normalizedName) {
    throw new Error(
      "Informe o nome do produto.",
    );
  }

  if (!normalizedCategoryId) {
    throw new Error(
      "Selecione uma categoria.",
    );
  }

  if (
    !Number.isFinite(normalizedPrice) ||
    normalizedPrice <= 0
  ) {
    throw new Error(
      "Informe um preço válido.",
    );
  }

  const productReference = doc(
    productsCollection(establishmentId),
  );

  let imageData = {
    fotoUrl: "",
    fotoPath: "",
  };

  try {
    if (foto) {
      imageData = await uploadProductImage({
        establishmentId,
        productId: productReference.id,
        file: foto,
        onProgress: onUploadProgress,
      });
    }

    await setDoc(productReference, {
      nome: normalizedName,
      descricao: normalizedDescription,
      preco: normalizedPrice,

      categoriaId:
        normalizedCategoryId,

      emoji: String(
        emoji || "🍽️",
      ),

      fotoUrl: imageData.fotoUrl,
      fotoPath: imageData.fotoPath,

      ativo: true,
      disponivel: true,

      ordem: Date.now(),

      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });

    return productReference.id;
  } catch (error) {
    if (imageData.fotoPath) {
      try {
        await deleteProductImage(
          imageData.fotoPath,
        );
      } catch (cleanupError) {
        console.error(
          "Erro ao desfazer upload:",
          cleanupError,
        );
      }
    }

    throw error;
  }
}

export async function updateProductAvailability({
  establishmentId,
  productId,
  disponivel,
}) {
  if (!establishmentId || !productId) {
    throw new Error(
      "Produto inválido.",
    );
  }

  const productReference = doc(
    db,
    "establishments",
    establishmentId,
    "products",
    productId,
  );

  await updateDoc(productReference, {
    disponivel: Boolean(disponivel),
    atualizadoEm: serverTimestamp(),
  });
}