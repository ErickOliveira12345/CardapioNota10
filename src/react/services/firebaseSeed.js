import {
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "../../firebase/firebaseConfig";
import {
  menuCategories,
  menuItems,
} from "./menuData";

export async function criarCardapioInicial(
  establishmentId
) {
  if (!establishmentId) {
    throw new Error(
      "O ID do estabelecimento é obrigatório."
    );
  }

  const batch = writeBatch(db);

  menuCategories.forEach((categoria, index) => {
    const categoryRef = doc(
      db,
      "establishments",
      establishmentId,
      "categories",
      categoria.id
    );

    batch.set(
      categoryRef,
      {
        nome: categoria.nome,
        icone: categoria.icone,
        descricao: categoria.descricao,
        ordem: categoria.ordem ?? index + 1,
        ativa: categoria.ativa ?? true,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );
  });

  menuItems.forEach((produto, index) => {
    const productRef = doc(
      db,
      "establishments",
      establishmentId,
      "products",
      String(produto.id)
    );

    const precoEmCentavos = Math.round(
      Number(produto.preco) * 100
    );

    batch.set(
      productRef,
      {
        nome: produto.nome,
        descricao: produto.descricao,

        categoryId: produto.categoria,

        preco: precoEmCentavos,

        emoji: produto.emoji || "",
        fotoUrl: "",
        fotoPath: "",

        ordem: index + 1,

        ativo: true,
        disponivel: true,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      }
    );
  });

  await batch.commit();

  return {
    categoriasCriadas: menuCategories.length,
    produtosCriados: menuItems.length,
  };
}