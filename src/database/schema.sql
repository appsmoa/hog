CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200) NOT NULL,
    total_units INTEGER,
    construction_date DATE,
    floor_area_ratio DECIMAL,
    building_coverage DECIMAL,
    heating_type VARCHAR(50),
    parking_ratio DECIMAL
);

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    apartment_id INTEGER REFERENCES apartments(id),
    contract_date DATE,
    price DECIMAL,
    floor INTEGER,
    area DECIMAL,
    type VARCHAR(50)
);