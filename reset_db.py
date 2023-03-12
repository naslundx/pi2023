import psycopg2

DB_URI = 'postgres://pxeomohmuomhjr:94718f15d1147f1962455cffafb5c618779485b3c162aed27facf5e3f6ccf9f2@ec2-52-49-120-150.eu-west-1.compute.amazonaws.com:5432/da2c0hg0fiagml'
DB_CONN = psycopg2.connect(DB_URI, sslmode='require')

def db_exec(query):
    try:
        cursor = DB_CONN.cursor()
        cursor.execute(query)
        DB_CONN.commit()
    finally:
        cursor.close()

def db_query(query):
    try:
        cursor = DB_CONN.cursor()
        cursor.execute(query)
        record = cursor.fetchall()
        return record
    finally:
        cursor.close()

drop_table_query = '''
    DROP TABLE users, generated, guess;
'''
create_table_query = '''
    CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT current_timestamp,
        ip VARCHAR(15) NULL UNIQUE
    );
    CREATE TABLE generated(
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        value BIGINT NOT NULL,
        position BIGINT NOT NULL,
        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE guess(
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT current_timestamp,
        generated_id INT NOT NULL UNIQUE,
        guess BIGINT NOT NULL,
        displayname VARCHAR(50),
        CONSTRAINT fk_generated FOREIGN KEY(generated_id) REFERENCES generated(id)
    );
'''
insert_table_query = '''
    INSERT INTO users(ip) 
    VALUES
        ('123.456.789.123');
'''

'''
    INSERT INTO generated(user_id, value, position)
    VALUES
        (1, 123, 456);
    INSERT INTO guess(generated_id, guess)
    VALUES
        (1, 454);
'''
db_exec(drop_table_query)
db_exec(create_table_query)
db_exec(insert_table_query)

DB_CONN.close()