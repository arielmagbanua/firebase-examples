import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp();
const db = admin.firestore();

export const dailyJob = functions.pubsub
  .schedule('30 5 * * *')
  .onRun((_) => {
    console.log('This will be run every day at 5:30 AM');
  });

export const taskRunner = functions.runWith({ memory: '2GB' })
  .pubsub
  .schedule('* * * * *')
  .onRun(async (_) => {
    console.log('by the minute!');

    // consistent timestamp
    const now = admin.firestore.Timestamp.now();

    // query all documents ready to perform
    const query = db.collection('tasks')
      .where('performAt', '<=', now)
      .where('status', '==', 'scheduled');

    const tasks = await query.get();

    // Jobs to execute concurrently
    const jobs: Promise<any>[] = [];

    // loop over documents and push job
    tasks.forEach((snapshot) => {
      const { worker, options } = snapshot.data();
      const job = workers[worker](options)
        .then(() => snapshot.ref.update({ status: 'complete' }))
        .catch((_) => snapshot.ref.update({ status: 'error' }));

      jobs.push(job);
    });

    // Execute all jobs concurrently
    return await Promise.all(jobs);
  });

// optional interface, all worker functions should return Promise.
interface Workers {
  [key: string]: (options: any) => Promise<any>
}

// Business logic for named tasks.
// Function name should match worker field on task document.
const workers: Workers = {
  helloWorld: () => db.collection('logs').add({ hello: 'world' }),
};
