import Queue from 'bull';
import logger from './logger.mjs';

// An artificial sleep method to simulate a wait.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Connect to an existing queue (if found), or, create a new queue in Redis.
const emailVerificationQueue = new Queue(
  'email-verification',
  process.env.REDIS_URL
);

// Defines a processing function for jobs in the queue. The function is async
// so it returns a promise.
emailVerificationQueue.process(async (job) => {
  logger.info(`Processing Job ID #${job.id}`, { data: job.data });

  // Making jobs fail 50% of the time. Failure is denoted by throwing an error
  // which rejects the processing functions promise.
  if (Math.random() < 0.5) {
    logger.error(`Failed to process Job ID #${job.id}`);
    throw new Error(`Job ${job.id} failed!`);
  }

  // Simulating a long running job and updating the jobs progress value.
  // This can be seen on the bull-board UI in the 'active' jobs section.
  let progress = 0;
  while (progress < 100) {
    await sleep(80);
    progress += 1;
    job.progress(progress);
  }

  // Success is denoted by resolving the processing functions promise. Data returned
  // while resolving is stored against the job and can be seen in redis or the
  // services GET `/jobs/:id` endpoint as `returnValue`.
  logger.info(`Successfully processed Job ID #${job.id}`);
  return { emailSent: true, sentAt: new Date().getTime() };
});

// Logging to the console every time a job is completed successfully.
emailVerificationQueue.on('completed', (job) => {
  logger.info(`Job with id ${job.id} has been completed.`, job.returnvalue);
});
