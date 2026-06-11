ALTER TABLE public.availability_slots
  ADD COLUMN IF NOT EXISTS capacity INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS booked_count INTEGER NOT NULL DEFAULT 0;

UPDATE public.availability_slots SET capacity = 10 WHERE capacity IS NULL OR capacity < 10;
UPDATE public.availability_slots SET booked_count = 1 WHERE status = 'booked' AND booked_count = 0;
UPDATE public.availability_slots SET status = 'open' WHERE booked_count < capacity AND status <> 'blocked';