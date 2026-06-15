-- Make project fields optional with defaults
ALTER TABLE projects ALTER COLUMN city SET DEFAULT '';
ALTER TABLE projects ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;
ALTER TABLE projects ALTER COLUMN ownership_type SET DEFAULT 'INTERNAL_COMPANY';
ALTER TABLE projects ALTER COLUMN executing_company_id DROP NOT NULL;

-- Make property fields optional
ALTER TABLE properties ALTER COLUMN "type" DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN surface DROP NOT NULL;
ALTER TABLE properties ALTER COLUMN price DROP NOT NULL;

-- Make intervenant trade optional
ALTER TABLE intervenants ALTER COLUMN trade DROP NOT NULL;
