import * as express from 'express';
import * as cors from 'cors';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import axios from 'axios';

const serviceAccount = require('../keyfile.json');

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

const location = 'asia-east1';
const functionsRegion = functions.region(location);

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

  const dataPayload = {
    data: {
      collection: collection,
      document: data,
    },
  };

  const url = `https://asia-east1-fir-examples-1f2df.cloudfunctions.net/createDocumentTask`;
  const result = await axios.post(url, dataPayload, {
    headers: {
      'Content-type': 'application/json',
      'Authorization': `Bearer ${process.env.API_KEY}`
    }
  })
    .then(function (response) {
      return response;
    })
    .catch(function (error) {
      console.log(error);
      return null;
    });

  console.log(result);

  res.send({ success: true });
});

expressApp.get('/test', async (req, res) => {
  res.send({ success: true });
});

export const api = functionsRegion.https.onRequest(expressApp);
