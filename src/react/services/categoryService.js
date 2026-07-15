import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

function categoriesCollection(establishmentId) {
  return collection(
    db,
    "establishments",
    establishmentId,
    "categories",
  );
}

export function observeCategories(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange([]);
    return () => {};
  }

  const categoriesQuery = query(
    categoriesCollection(establishmentId),
    orderBy("ordem", "asc"),
  );

  return onSnapshot(
    categoriesQuery,
    (snapshot) => {
      const categories = snapshot.docs.map(
        (document) => ({
          id: document.id,
          ...document.data(),
        }),
      );

      onChange(categories);
    },
    (error) => {
      console.error(
        "Erro ao carregar categorias:",
        error,
      );

      onError?.(error);
    },
  );
}

export async function createCategory({
  establishmentId,
  nome,
  descricao,
  icone = "🍽️",
}) {
  if (!establishmentId) {
    throw new Error(
      "Estabelecimento não identificado.",
    );
  }

  const normalizedName =
    String(nome || "").trim();

  if (!normalizedName) {
    throw new Error(
      "Informe o nome da categoria.",
    );
  }

  const categoryReference = await addDoc(
    categoriesCollection(establishmentId),
    {
      nome: normalizedName,
      descricao: String(
        descricao || "",
      ).trim(),

      icone: String(
        icone || "🍽️",
      ).trim(),

      ativa: true,

      ordem: Date.now(),

      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    },
  );

  return categoryReference.id;
}

export async function updateCategory({
  establishmentId,
  categoryId,
  nome,
  descricao,
  icone,
}) {
  if (
    !establishmentId ||
    !categoryId
  ) {
    throw new Error(
      "Categoria inválida.",
    );
  }

  const normalizedName =
    String(nome || "").trim();

  if (!normalizedName) {
    throw new Error(
      "Informe o nome da categoria.",
    );
  }

  const categoryReference = doc(
    db,
    "establishments",
    establishmentId,
    "categories",
    categoryId,
  );

  await updateDoc(categoryReference, {
    nome: normalizedName,
    descricao: String(
      descricao || "",
    ).trim(),

    icone: String(
      icone || "🍽️",
    ).trim(),

    atualizadoEm: serverTimestamp(),
  });
}

export async function updateCategoryVisibility({
  establishmentId,
  categoryId,
  ativa,
}) {
  if (
    !establishmentId ||
    !categoryId
  ) {
    throw new Error(
      "Categoria inválida.",
    );
  }

  const categoryReference = doc(
    db,
    "establishments",
    establishmentId,
    "categories",
    categoryId,
  );

  await updateDoc(categoryReference, {
    ativa: Boolean(ativa),
    atualizadoEm: serverTimestamp(),
  });
}

export async function updateCategoryOrder({
  establishmentId,
  categoryId,
  ordem,
}) {
  if (
    !establishmentId ||
    !categoryId
  ) {
    throw new Error(
      "Categoria inválida.",
    );
  }

  const categoryReference = doc(
    db,
    "establishments",
    establishmentId,
    "categories",
    categoryId,
  );

  await updateDoc(categoryReference, {
    ordem: Number(ordem),
    atualizadoEm: serverTimestamp(),
  });
}

export async function deleteCategory({
  establishmentId,
  categoryId,
}) {
  if (
    !establishmentId ||
    !categoryId
  ) {
    throw new Error(
      "Categoria inválida.",
    );
  }

  const categoryReference = doc(
    db,
    "establishments",
    establishmentId,
    "categories",
    categoryId,
  );

  await deleteDoc(categoryReference);
}