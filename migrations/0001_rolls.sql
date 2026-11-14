CREATE TABLE rolls (
  slug        TEXT PRIMARY KEY CHECK (length(slug) BETWEEN 1 AND 64 AND slug NOT GLOB '*[^a-z0-9-]*'),
  title       TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 120),
  camera      TEXT,               -- film rolls: the camera, since scans carry the scanner's EXIF
  film        TEXT,               -- film stock
  date        TEXT CHECK (date IS NULL OR date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]' OR date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  ignore_exif INTEGER NOT NULL DEFAULT 0 CHECK (ignore_exif IN (0, 1)),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
) STRICT;

CREATE TABLE cameras (
  raw     TEXT PRIMARY KEY,       -- 'FUJIFILM|X-T5'
  display TEXT NOT NULL           -- 'Fujifilm X-T5'
) STRICT;

CREATE TABLE photos (
  -- identity: the upload route, once
  id             TEXT PRIMARY KEY CHECK (length(id) = 16),   -- first 16 hex chars of sha256
  sha256         TEXT NOT NULL UNIQUE CHECK (length(sha256) = 64),
  roll           TEXT NOT NULL REFERENCES rolls(slug) ON UPDATE CASCADE,
  original_key   TEXT NOT NULL UNIQUE,                       -- 'originals/<roll>/<id>.jpg'
  filename       TEXT,                                       -- name on the camera or phone; tie-break for frame order

  -- editorial: the upload route, then PATCH only
  caption        TEXT CHECK (caption IS NULL OR length(caption) BETWEEN 1 AND 280),
  alt            TEXT CHECK (alt IS NULL OR length(alt) BETWEEN 1 AND 420),
  featured       INTEGER NOT NULL DEFAULT 0 CHECK (featured IN (0, 1)),
  hidden         INTEGER NOT NULL DEFAULT 0 CHECK (hidden IN (0, 1)),

  -- derived: the ingest only
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'failed')),
  error          TEXT,
  width          INTEGER,
  height         INTEGER,
  placeholder    TEXT,            -- 'data:image/webp;base64,...'
  taken_at       TEXT,            -- local wall clock with offset: '2026-10-12T17:42:03+05:30'
  taken_month    TEXT,            -- 'YYYY-MM' from the local date
  date_source    TEXT CHECK (date_source IN ('exif', 'roll', 'upload')),
  date_precision TEXT CHECK (date_precision IN ('time', 'day', 'month')),
  camera_raw     TEXT,            -- 'Make|Model', joined to cameras when read
  lens           TEXT,
  focal_mm       REAL,
  focal_35mm     INTEGER,
  aperture       REAL,
  shutter_s      REAL,
  iso            INTEGER,
  exposure_ev    REAL,
  film           TEXT,            -- Fuji film simulation; film rolls use rolls.film
  exif_json      TEXT CHECK (exif_json IS NULL OR json_valid(exif_json)),
  ingest_version INTEGER,         -- bumped in code when parsing or normalising changes
  uploaded_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  ingested_at    TEXT,

  -- NULL passes a CHECK, so every column a page needs is tested with IS NOT NULL
  CHECK (status <> 'ready' OR (
    width IS NOT NULL AND width > 0 AND height IS NOT NULL AND height > 0
    AND placeholder IS NOT NULL AND taken_at IS NOT NULL AND taken_month IS NOT NULL
    AND date_source IS NOT NULL AND date_precision IS NOT NULL
  ))
) STRICT;

CREATE INDEX photos_visible_by_month ON photos (taken_month, taken_at) WHERE status = 'ready' AND hidden = 0;
CREATE INDEX photos_by_roll ON photos (roll);
