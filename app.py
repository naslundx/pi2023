from flask import Flask, send_from_directory, request
import json
import http.client
import psycopg2
import random

import http.client

import requests



# === DATABASE ===
DB_URI = 'postgres://pxeomohmuomhjr:94718f15d1147f1962455cffafb5c618779485b3c162aed27facf5e3f6ccf9f2@ec2-52-49-120-150.eu-west-1.compute.amazonaws.com:5432/da2c0hg0fiagml'
DB_CONN = psycopg2.connect(DB_URI, sslmode='require')

# TODO secure all queries

def db_exec(query, get_value=False):
    try:
        cursor = DB_CONN.cursor()
        cursor.execute(query)
        DB_CONN.commit()
        if get_value:
            id_of_new_row = cursor.fetchone()[0]
            return id_of_new_row
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


# === DECIMAL SERVICE ===
PI_URL = 'https://api.pi.delivery/v1/pi'

def get_decimals(position):
    r = requests.get(url=PI_URL, params={"start": position, "numberOfDigits": 10})
    data = r.json()
    return data['content']


# === FRONTEND ===
# TODO change from src to public when building works
app = Flask(
    __name__,
    static_url_path='',
    static_folder='src/')

@app.get("/")
def hello_world():
    return send_from_directory('src', 'index.html')


# === BACKEND ===
def check_user(ip_addr):
    sql_query = f'''
        SELECT id, timestamp > current_timestamp - interval '10 seconds'
        FROM users
        WHERE ip='{ip_addr}'
    '''
    result = db_query(sql_query)

    sql_query = f'''
        INSERT INTO users(ip)
        VALUES
            ('{ip_addr}')
        ON CONFLICT (ip) DO UPDATE
        SET timestamp = current_timestamp
        RETURNING id;
    '''
    updated_id = db_exec(sql_query)

    print(result)
    return result[0] if result else (updated_id, False)
    

@app.get("/generate")
def generate():
    ip_addr = request.remote_addr

    user_id, forbidden = check_user(ip_addr)
    if forbidden:
        return {"error": "overload"}, 400

    correct_position = random.randint(1, 1_000_000_000)
    value = get_decimals(correct_position)

    sql_query = f'''
        INSERT INTO generated(user_id, value, position)
        VALUES
            ({user_id}, {value}, {correct_position})
        RETURNING id;
    '''
    generated_id = db_exec(sql_query, True)

    return {
        "generated_id": generated_id,
        "user_id": user_id,
        "value": value
    }

@app.get("/guess")
def vote():
    print('guess')

    user_id = request.args.get('user_id')
    generated_id = request.args.get('generated_id')
    name = request.args.get('name')
    guess = request.args.get('guess')

    try:
        assert 3 < len(name) < 50
        user_id = int(user_id)
        generated_id = int(generated_id)
        guess = int(guess)
        assert 0 < guess < 1_000_000_000
    except (ValueError, AssertionError):
        return {"error": "invalid"}, 400

    try:
        sql_query = f'''
            INSERT INTO guess(generated_id, guess, displayname)
            VALUES
                ({generated_id}, {guess}, '{name}');
        '''
        db_exec(sql_query)
    except psycopg2.errors.UniqueViolation:
        return { "error": "exists" }, 400 
    
    sql_query = f'''
        SELECT position
        FROM generated
        WHERE id={generated_id};
    '''
    correct_position = db_query(sql_query)[0][0]

    return {
        "guess": guess,
        "correct_position": correct_position,
        "difference": abs(guess-correct_position),
    }

@app.get("/stats")
def stats():
    sql_query = '''
        SELECT 
            COUNT(*), MAX(timestamp)
        FROM
            guess;
    '''
    results = db_query(sql_query)
    if not results or not results[0][1]:
        return {}

    user_count, latest_visit = results[0]

    return {
        "user_count": user_count,
        "latest_visit": latest_visit.strftime("%d/%m %H:%M:%S"),
    }

@app.get("/scores")
def scores():
    sql_query = '''
        SELECT 
            guess.displayname,
            generated.value,
            generated.position,
            guess.guess,
            guess.timestamp
        FROM guess
        INNER JOIN generated
        ON guess.generated_id = generated.id
        ORDER BY (guess.guess - generated.position) DESC
        LIMIT 5;
    '''

    results = db_query(sql_query)

    return [
        {
            "name": result[0],
            "value": result[1],
            "correct": result[2],
            "guess": result[3],
            "timestamp": result[4].strftime("%Y-%m-%d %H:%M:%S"),
        }
        for result in results
    ]
