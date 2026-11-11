-- Keep authenticated access limited to the operations governed by the places
-- RLS policies. TRUNCATE, REFERENCES and TRIGGER are not needed by the app.

REVOKE ALL PRIVILEGES ON TABLE public.places FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.places TO authenticated;
