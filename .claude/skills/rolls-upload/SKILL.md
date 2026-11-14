---
name: rolls-upload
description: Upload a folder of photos to the /rolls page on sidv.dev as one roll. Use when the user points at a folder and asks to upload, add or publish its photos to rolls ("upload ~/Pictures/goa to rolls", "put these photos on the site").
---

# Upload a folder to /rolls

`scripts/rolls.mjs upload <folder>` does the uploading. It reads `<folder>/roll.json`, creates or updates the roll, and sends every `.jpg`/`.jpeg` in the folder to `PUT /api/rolls/upload`, the same route the iPhone Shortcut uses. Each photo gets a `202` right away; the queue consumer makes the WebPs and the photo goes live a few seconds later. This skill gets a folder into the shape the script expects, then runs it.

The upload publishes to the live site, so get the user's yes on the plan (step 5) before running it.

## 1. Look at the folder

List the folder without recursing into subfolders. Sort the files into:

- **JPEG** (`.jpg`, `.jpeg`, any case): uploaded as they are.
- **HEIC/HEIF**: the upload route only takes JPEG, so these get converted in step 4.
- **Anything else** (PNG, RAW, video, `.AAE` sidecars): skipped. Name them in the plan.

Files over 50 MB are refused by the route (`413`); name any you find.

If the folder already has a `roll.json`, read it and use what it says.

## 2. The roll

`roll.json` fields:

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | up to 120 characters |
| `slug` | no | `a-z`, `0-9` and `-`, 1 to 64 characters; defaults to the folder's name |
| `camera`, `film` | no | for film rolls |
| `date` | no | `YYYY-MM` or `YYYY-MM-DD`; used when a photo has no EXIF date |
| `ignoreExif` | no | `true` for film scans, so the scanner's EXIF isn't shown as the camera |
| `photos` | no | `{ "<filename>": { "alt": "…", "caption": "…", "featured": true } }` |

Ask the user for the title if there's no `roll.json`; suggest a slug from the folder name. If the photos are film scans, ask for camera, film and date and set `ignoreExif`.

Check the slug against the existing rolls, because `PUT` on an existing slug overwrites its title, camera, film and date:

```bash
curl -s -H "Authorization: Bearer $(security find-generic-password -s sidv-rolls-upload-token -w)" https://sidv.dev/api/rolls/list
```

## 3. Alt text and captions

Look at each photo with the Read tool (for a HEIC, look at the converted JPEG from step 4) and draft alt text: what's in the frame, plainly, in one or two sentences (420 characters at most). Captions are the user's words: only add the ones they give you (280 characters at most). Ask which photos, if any, should be Featured.

Show the drafts as a table (file, alt, caption, featured) and let the user edit them. Photos without alt text are still shown on the site; the script lists them at the end.

## 4. Stage the upload

Never write into the user's folder. Stage the upload in the scratchpad: `SRC` is the user's folder and `STAGE` is e.g. `<scratchpad>/rolls-<slug>`.

```bash
mkdir -p "$STAGE"
find "$SRC" -maxdepth 1 -type f \( -iname '*.jpg' -o -iname '*.jpeg' \) -exec cp {} "$STAGE"/ \;
find "$SRC" -maxdepth 1 -type f \( -iname '*.heic' -o -iname '*.heif' \) -print0 |
  while IFS= read -r -d '' f; do n=$(basename "$f"); sips -s format jpeg "$f" --out "$STAGE/${n%.*}.jpg" >/dev/null; done
```

`sips` ships with macOS and keeps the EXIF the ingest reads (camera, lens, exposure, date and offset). It writes the same bytes each time it converts the same HEIC, so a re-run still finds the photos it already uploaded. Before converting, check whether a HEIC shares its name with a JPEG in the folder (`IMG_1.HEIC` next to `IMG_1.JPG`, usually the same shot twice): the conversion would overwrite the copied JPEG, so ask the user which to keep.

Write `roll.json` into the staging folder with `slug` set explicitly (the staging folder's name isn't the roll's), and key `photos` by the staged file names.

## 5. Confirm, then upload

Tell the user the plan in a few lines: the roll (new or updated, and what changes), how many photos, which were converted and which skipped. Upload after they say yes:

```bash
ROLLS_UPLOAD_TOKEN="$(security find-generic-password -s sidv-rolls-upload-token -w)" node scripts/rolls.mjs upload "$STAGE"
```

Never print the token or put it in a file. The script uploads four at a time and prints one line per photo:

- `uploaded as <id>, processing`: stored and queued.
- `already uploaded as <id>`: the same bytes are already live. The script doesn't change their caption or alt text; use `edit` (below).
- `<status> <error>`: that photo failed. Running the same command again is safe: finished photos come back as duplicates and the rest are sent again.

## 6. Check they're live

About half a minute after the upload, every new id should have its derivatives:

```bash
for id in <ids>; do printf '%s ' "$id"; curl -s -o /dev/null -w '%{http_code}\n' "https://img.sidv.dev/p/$id-640.webp"; done
```

`200` means the photo is ready. A `404` a few minutes later means the ingest is still retrying or has failed; it retries with backoff for a few minutes before giving up. If curl prints `000`, the Mac's DNS cache is stale: add `--resolve img.sidv.dev:443:<ip>` with an IP from `dig +short img.sidv.dev @1.1.1.1`.

The `/rolls` pages are cached for up to ten minutes, so new photos can take that long to appear there.

Report the roll, how many photos went live, and anything skipped or failed.

## Changing a photo afterwards

```bash
ROLLS_UPLOAD_TOKEN="$(security find-generic-password -s sidv-rolls-upload-token -w)" node scripts/rolls.mjs edit <file or id> --caption "…" --alt "…" --feature --hide
```

A file path works in place of the id: the id is the first 16 hex characters of the file's SHA-256, so pass the staged JPEG for a converted HEIC. `--caption ""` clears a caption; `--unfeature` and `--show` undo the others.
