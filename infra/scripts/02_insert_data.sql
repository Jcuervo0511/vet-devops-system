INSERT INTO owners (id, full_name, email, phone_number) VALUES
    ('a1b2c3d4-0000-0000-0000-000000000001', 'Juan Pérez', 'juan.perez@example.com', '3001234567'),
    ('a1b2c3d4-0000-0000-0000-000000000002', 'María García', 'maria.garcia@example.com', '3109876543');

INSERT INTO pets (id, name, species, breed, birth_date, owner_id) VALUES
    ('b1b2c3d4-0000-0000-0000-000000000001', 'Firulais', 'Dog', 'Labrador', '2020-05-10', 'a1b2c3d4-0000-0000-0000-000000000001'),
    ('b1b2c3d4-0000-0000-0000-000000000002', 'Michi', 'Cat', 'Siamese', '2021-03-15', 'a1b2c3d4-0000-0000-0000-000000000002');

INSERT INTO appointments (pet_id, appointment_date, reason, status) VALUES
    ('b1b2c3d4-0000-0000-0000-000000000001', '2025-06-01 10:00:00', 'Vacunacion anual', 'SCHEDULED'),
    ('b1b2c3d4-0000-0000-0000-000000000002', '2025-06-03 14:30:00', 'Chequeo general', 'COMPLETED');

\echo '--- Owners ---'
SELECT id, full_name, email FROM owners;

\echo '--- Pets ---'
SELECT id, name, species, breed FROM pets;

\echo '--- Appointments ---'
SELECT id, reason, status, appointment_date FROM appointments;
