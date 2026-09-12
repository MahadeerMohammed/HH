ALTER TABLE rooms ADD COLUMN import_id UUID;
ALTER TABLE revenue_entries ADD COLUMN import_id UUID;
ALTER TABLE expenses ADD COLUMN import_id UUID;

UPDATE rooms SET import_id = gen_random_uuid() WHERE import_id IS NULL;
UPDATE revenue_entries SET import_id = gen_random_uuid() WHERE import_id IS NULL;
UPDATE expenses SET import_id = gen_random_uuid() WHERE import_id IS NULL;

ALTER TABLE rooms ALTER COLUMN import_id SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN import_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN import_id SET NOT NULL;

ALTER TABLE rooms ADD CONSTRAINT uk_rooms_import_id UNIQUE (import_id);
ALTER TABLE revenue_entries ADD CONSTRAINT uk_revenue_entries_import_id UNIQUE (import_id);
ALTER TABLE expenses ADD CONSTRAINT uk_expenses_import_id UNIQUE (import_id);
