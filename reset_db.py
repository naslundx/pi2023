import os
import psycopg2

DB_URI = os.environ.get('DATABASE_URL')
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
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT current_timestamp,
        displayname VARCHAR(50) NOT NULL
    );
    CREATE TABLE generated(
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL,

        value DECIMAL NOT NULL,
        position DECIMAL NOT NULL,

        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE game(
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL,

        CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
    );
    CREATE TABLE guess(
        id SERIAL PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT current_timestamp,
        generated_id INT NOT NULL UNIQUE,
        game_id UUID NOT NULL,
        
        guess DECIMAL NOT NULL,

        CONSTRAINT fk_generated FOREIGN KEY(generated_id) REFERENCES generated(id),
        CONSTRAINT fk_game FOREIGN KEY(game_id) REFERENCES game(id)
    );
'''

# db_exec(drop_table_query)
db_exec(create_table_query)
# db_exec(insert_table_query)

DB_CONN.close()