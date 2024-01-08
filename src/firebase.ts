import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

import serviceAccount from '../tablerototal-firebase-adminsdk-9c2wp-b76c7b96c6.json'

initializeApp({
  credential: cert(serviceAccount as ServiceAccount)
});

const db = getFirestore();

export function addGameRecord(userId: string, results: Record<string, unknown>) {
  db.collection('users').doc(userId).collection('games').add(results)
}