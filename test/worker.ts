// The real entry (dist/_worker.js) only exists after an Astro build. Tests run against
// this stand-in so they don't depend on a build; it grows as worker routes are added.
export default {} satisfies ExportedHandler<Env>;
