import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "../firebase/firebaseConfig";

function collectionRef(establishmentId, collectionName) {
  return collection(
    db,
    "establishments",
    establishmentId,
    collectionName,
  );
}

function documentRef(
  establishmentId,
  collectionName,
  documentId,
) {
  return doc(
    db,
    "establishments",
    establishmentId,
    collectionName,
    documentId,
  );
}

// CREATE

export async function createDocument(
  establishmentId,
  collectionName,
  data,
  documentId = null,
) {
  if (!establishmentId) {
    throw new Error("EstablishmentId obrigatório.");
  }

  if (documentId) {
    await setDoc(
      documentRef(
        establishmentId,
        collectionName,
        documentId,
      ),
      {
        ...data,
        criadoEm: new Date(),
      },
    );

    return documentId;
  }

  const ref = await addDoc(
    collectionRef(establishmentId, collectionName),
    {
      ...data,
      criadoEm: new Date(),
    },
  );

  return ref.id;
}

// READ

export async function getDocument(
  establishmentId,
  collectionName,
  documentId,
) {
  const snapshot = await getDoc(
    documentRef(
      establishmentId,
      collectionName,
      documentId,
    ),
  );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
}

export async function getCollection(
  establishmentId,
  collectionName,
) {
  const snapshot = await getDocs(
    collectionRef(establishmentId, collectionName),
  );

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// UPDATE

export async function updateDocument(
  establishmentId,
  collectionName,
  documentId,
  data,
) {
  await updateDoc(
    documentRef(
      establishmentId,
      collectionName,
      documentId,
    ),
    {
      ...data,
      atualizadoEm: new Date(),
    },
  );
}

// DELETE

export async function deleteDocument(
  establishmentId,
  collectionName,
  documentId,
) {
  await deleteDoc(
    documentRef(
      establishmentId,
      collectionName,
      documentId,
    ),
  );
}