import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

import serviceAccount from '../tablerototal-firebase-adminsdk-9c2wp-b76c7b96c6.json'
import type { GameRecord } from './sockets/types';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount)
});

const db = getFirestore()

export function addGameRecord(userId: string, results: GameRecord) {
  db.collection('users').doc(userId).collection('games').add(results)
}