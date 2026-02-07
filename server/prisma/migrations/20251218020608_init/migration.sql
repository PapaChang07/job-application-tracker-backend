-- CreateTable
CREATE TABLE "Job" (
    "id" SERIAL NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'applied',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS gmail_connections (
  user_id            uuid PRIMARY KEY,
  email_address      text,
  access_token       text,
  refresh_token      text,
  expiry_date_ms     bigint,
  scope              text,
  token_type         text,
  last_scan_at       timestamptz,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gmail_messages (
  id                 bigserial PRIMARY KEY,
  user_id            uuid NOT NULL,
  gmail_message_id   text NOT NULL,
  gmail_thread_id    text,
  from_email         text,
  from_name          text,
  subject            text,
  snippet            text,
  internal_date_ms   bigint,
  classification     text,   -- 'rejection' | 'other'
  confidence         real,
  created_at         timestamptz DEFAULT now(),
  UNIQUE (user_id, gmail_message_id)
);

