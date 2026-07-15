import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

import {
  db,
} from "../firebase/firebaseConfig.js";

export function observeMenuCategories(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange([]);
    return () => {};
  }

  const categoriesQuery = query(
    collection(
      db,
      "establishments",
      establishmentId,
      "categories",
    ),
    orderBy("ordem", "asc"),
  );

  return onSnapshot(
    categoriesQuery,
    (snapshot) => {
      const categories = snapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .filter(
          (category) =>
            category.ativa !== false,
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

export function observeMenuProducts(
  establishmentId,
  onChange,
  onError,
) {
  if (!establishmentId) {
    onChange([]);
    return () => {};
  }

  const productsQuery = query(
    collection(
      db,
      "establishments",
      establishmentId,
      "products",
    ),
    orderBy("ordem", "asc"),
  );

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      const products = snapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .filter(
          (product) =>
            product.ativo !== false &&
            product.disponivel !== false,
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