ALTER TABLE rooms RENAME COLUMN base_rate TO room_rent;

ALTER TABLE revenue_entries ADD COLUMN booking_group_id UUID;
ALTER TABLE revenue_entries ADD COLUMN check_in_date DATE;
ALTER TABLE revenue_entries ADD COLUMN check_in_time TIME;
ALTER TABLE revenue_entries ADD COLUMN charge_from_date DATE;
ALTER TABLE revenue_entries ADD COLUMN rent_until_date DATE;
ALTER TABLE revenue_entries ADD COLUMN checkout_date DATE;
ALTER TABLE revenue_entries ADD COLUMN mobile_number VARCHAR(30);
ALTER TABLE revenue_entries ADD COLUMN address VARCHAR(1200);
ALTER TABLE revenue_entries ADD COLUMN aadhar_number VARCHAR(30);
ALTER TABLE revenue_entries ADD COLUMN purpose_of_stay VARCHAR(255);
ALTER TABLE revenue_entries ADD COLUMN room_rent NUMERIC(12, 2);
ALTER TABLE revenue_entries ADD COLUMN rent_edit_reason VARCHAR(500);
ALTER TABLE revenue_entries ADD COLUMN rent_days INTEGER;
ALTER TABLE revenue_entries ADD COLUMN checking_out BOOLEAN;

UPDATE revenue_entries
SET
    booking_group_id = gen_random_uuid(),
    check_in_date = stay_date,
    check_in_time = TIME '12:00',
    charge_from_date = stay_date,
    rent_until_date = stay_date + (GREATEST(nights, 1) - 1),
    mobile_number = 'UNKNOWN',
    address = 'Migrated from previous revenue entry.',
    aadhar_number = 'UNKNOWN',
    purpose_of_stay = booking_channel,
    room_rent = CASE
        WHEN GREATEST(nights, 1) = 0 THEN gross_revenue
        ELSE ROUND(gross_revenue / GREATEST(nights, 1), 2)
    END,
    rent_days = GREATEST(nights, 1),
    checking_out = FALSE;

ALTER TABLE revenue_entries ALTER COLUMN booking_group_id SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN check_in_date SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN check_in_time SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN charge_from_date SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN rent_until_date SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN mobile_number SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN address SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN aadhar_number SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN purpose_of_stay SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN room_rent SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN rent_days SET NOT NULL;
ALTER TABLE revenue_entries ALTER COLUMN checking_out SET NOT NULL;

DROP INDEX IF EXISTS idx_revenue_entries_stay_date;
CREATE INDEX idx_revenue_entries_check_in_date ON revenue_entries (check_in_date);
CREATE INDEX idx_revenue_entries_booking_group_id ON revenue_entries (booking_group_id);

ALTER TABLE revenue_entries DROP COLUMN stay_date;
ALTER TABLE revenue_entries DROP COLUMN booking_channel;
ALTER TABLE revenue_entries DROP COLUMN nights;
ALTER TABLE revenue_entries DROP COLUMN gross_revenue;
ALTER TABLE revenue_entries DROP COLUMN platform_fee;
ALTER TABLE revenue_entries DROP COLUMN tax_amount;
ALTER TABLE revenue_entries DROP COLUMN variable_cost;
ALTER TABLE revenue_entries DROP COLUMN notes;
