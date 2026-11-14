import { handleRollsApi } from '../worker/rolls-api';
import { handleIngestBatch } from '../worker/rolls-ingest';

// The real entry (dist/_worker.js) only exists after an Astro build, so tests run against
// the rolls handlers directly. worker/entry.ts routes to the same functions.
export default {
  fetch: (request, env) => handleRollsApi(request, env),
  queue: (batch, env) => handleIngestBatch(batch, env),
} satisfies ExportedHandler<Env>;
