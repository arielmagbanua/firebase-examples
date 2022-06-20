import * as express from 'express';
import * as cors from 'cors';
import * as functions from 'firebase-functions';
import { getFunctions } from 'firebase-admin/functions';
import * as admin from 'firebase-admin';

const serviceAccount = require('../keyfile.json');

console.log(serviceAccount);

// initialize Firebase
const adminApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// get the firestore
const firestore = adminApp.firestore();

// intialize express app
const expressApp = express();

// automatically allow cross-origin requests
expressApp.use(cors({ origin: true }));

const functionsRegion = functions.region('asia-east1');

// create a document with tasks
export const createDocumentTask = functionsRegion.tasks.taskQueue({
  retryConfig: {
    maxAttempts: 5,
    minBackoffSeconds: 60,
  },
  rateLimits: {
    maxConcurrentDispatches: 6,
  },
}).onDispatch(async (data) => {
  const dataCollection = data.collection;
  const dataDocument = data.document;

  console.log('collection: ' + dataCollection);
  console.log('title' + dataDocument.title);
  console.log('director' + dataDocument.director);

  const docRef = await firestore.collection(dataCollection).add(dataDocument);

  console.log('Document written with ID: ', docRef.id);
});

expressApp.post('/createDocument', async (req, res) => {
  const { collection, data } = req.body;
  
  const queue = getFunctions().taskQueue('createDocumentTask');
  console.log(queue);

  const dataPayload = {
    data: {
      collection: collection,
      document: data,
    },
  };

  queue.enqueue(dataPayload, {
    scheduleDelaySeconds: 5,
    dispatchDeadlineSeconds: 60
  });

  res.send({ success: true });
});

expressApp.get('/test', async (req, res) => {
  res.send({ success: true });
});

export const testTask = functionsRegion.https.onRequest(async (req, res) => {
  if (req.method == 'POST') {
    const { collection, data } = req.body;

    const dataPayload = {
      data: {
        collection: collection,
        document: data,
      },
    };

    console.log(dataPayload);

    const queue = getFunctions().taskQueue('createDocumentTask');
    await queue.enqueue(dataPayload);

    res.send('Will create document');
    return;
  }

  res.send({ success: true });
});

export const api = functionsRegion.https.onRequest(expressApp);

