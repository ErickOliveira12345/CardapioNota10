// import {
//   collection,
//   doc,
//   getDocs,
//   orderBy,
//   query,
//   updateDoc,
// } from "firebase/firestore";

// import { db } from "../firebase/firebaseConfig.js";

// function mapDocuments(snapshot) {
//   return snapshot.docs.map((document) => ({
//     id: document.id,
//     ...document.data(),
//   }));
// }

// export async function getAllEstablishments() {
//   const establishmentsQuery = query(
//     collection(db, "establishments"),
//     orderBy("criadoEm", "desc"),
//   );

//   const snapshot = await getDocs(establishmentsQuery);

//   return mapDocuments(snapshot);
// }

// export async function getAllSubscriptions() {
//   const snapshot = await getDocs(
//     collection(db, "subscriptions"),
//   );

//   return mapDocuments(snapshot);
// }

// export async function getAllPlans() {
//   const snapshot = await getDocs(
//     collection(db, "plans"),
//   );

//   return mapDocuments(snapshot);
// }

// export async function getAllPayments() {
//   const snapshot = await getDocs(
//     collection(db, "payments"),
//   );

//   return mapDocuments(snapshot);
// }

// export async function updateEstablishmentStatus(
//   establishmentId,
//   status,
// ) {
//   if (!establishmentId) {
//     throw new Error(
//       "O ID do estabelecimento é obrigatório.",
//     );
//   }

//   await updateDoc(
//     doc(db, "establishments", establishmentId),
//     {
//       status,
//       atualizadoEm: new Date(),
//     },
//   );
// }