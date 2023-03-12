import psycopg2

DB_URI = 'postgres://pfomexbowvgncu:6580fde90a9ef4507f27b3eef791a60b177a4f8c2188e1c81ed57651e27a84c2@ec2-34-241-90-235.eu-west-1.compute.amazonaws.com:5432/deo9s6qdei6ei1'
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
'''
create_table_query = '''
    DROP TABLE users, generated, guess, game;
    CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT current_timestamp,
        displayname VARCHAR(50) NOT NULL
    );
    CREATE TABLE generated(
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,

        value BIGINT NOT NULL,
        position BIGINT NOT NULL,

        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE game(
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,

        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE guess(
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT current_timestamp,
        generated_id INT NOT NULL UNIQUE,
        game_id INT NOT NULL,
        
        guess BIGINT NOT NULL,

        CONSTRAINT fk_generated FOREIGN KEY(generated_id) REFERENCES generated(id),
        CONSTRAINT fk_game FOREIGN KEY(game_id) REFERENCES game(id)
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
# db_exec(drop_table_query)
db_exec(create_table_query)
# db_exec(insert_table_query)

DB_CONN.close()