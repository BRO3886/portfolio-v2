/// <reference types="astro/client" />

type RollsRuntime = import('@astrojs/cloudflare').Runtime<{ DB: import('./lib/rolls/db').RollsDb; ROLLS_IMG_BASE: string }>;

declare namespace App {
  interface Locals extends RollsRuntime {}
}
