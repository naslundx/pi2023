from flask import Flask, send_from_directory, request
import json
import http.client
import psycopg2
import random
import os

import http.client

import requests


# === DATABASE ===
DB_URI = os.environ.get('DATABASE_URL')
DB_CONN = psycopg2.connect(DB_URI, sslmode='require')

# TODO secure all queries

def db_exec(query, get_value=False, params=None):
    # print(query)

    try:
        cursor = DB_CONN.cursor()
        cursor.execute(query, params)
        DB_CONN.commit()
        if get_value:
            id_of_new_row = cursor.fetchone()[0]
            print(id_of_new_row)
            return id_of_new_row
    finally:
        cursor.close()

def db_query(query, single=False, params=None):
    # print(query)

    try:
        cursor = DB_CONN.cursor()
        cursor.execute(query, params)
        if single:
            record = cursor.fetchone()[0]
        else:
            record = cursor.fetchall()

        # print(record)
        return record
    finally:
        cursor.close()


# === DECIMAL SERVICE ===
PI_URL = 'https://api.pi.delivery/v1/pi'

def get_decimals(position):
    r = requests.get(url=PI_URL, params={"start": position, "numberOfDigits": 10})
    data = r.json()
    return data['content']

# === DB HELPERS ===

def get_score(game_id):
    sql_query = f'''
        SELECT
            SUM(ABS(guess.guess - generated.position))
        FROM
            guess
        LEFT JOIN
            generated
        ON
            guess.generated_id = generated.id
        WHERE
            guess.game_id = %s;
    '''
    score = db_query(sql_query, True, (game_id,))
    return score

# === FRONTEND ===
# TODO change from src to public when building works
app = Flask(
    __name__,
    static_url_path='',
    static_folder='src/'
)

@app.get("/")
def hello_world():
    return send_from_directory('src', 'index.html')


# === BACKEND ===
@app.get("/start")
def endpoint_start():
    user_id = request.args.get('user_id')
    username = request.args.get('name')

    if not username or not (2 < len(username) < 25):
        return { "error": "incorrect name" }, 400

    if not user_id or user_id == 'null':
        # skapa ny user
        sql_query = f'''
            INSERT INTO users(displayname)
            VALUES
                (%s)
            RETURNING id;
        '''
        user_id = db_exec(sql_query, True, (username, ))
    else:
        # verify user exists
        sql_query = f'''
            SELECT COUNT(*)
            FROM users
            WHERE id=%s AND displayname=%s;
        '''
        exists = db_query(sql_query, True, (user_id, username))
        if not exists:
            return { "error": "invalid game" }, 400

    # skapa ny game
    sql_query = f'''
        INSERT INTO game(user_id)
        VALUES
            (%s)
        RETURNING id;
    '''
    game_id = db_exec(sql_query, True, (user_id, ))
    
    # skicka tillbaka user_id, game_id
    return {
        'user_id': user_id,
        'game_id': game_id
    }

@app.get("/next")
def endpoint_next():
    user_id = request.args.get('user_id')
    game_id = request.args.get('game_id')

    # kolla att user+game pair finns
    sql_query = f'''
        SELECT COUNT(*)
        FROM game
        WHERE id=%s AND user_id=%s;
    '''
    exists = db_query(sql_query, True, (game_id, user_id))
    if not exists:
        return { "error": "invalid game" }, 400
    
    # kolla hur många gissningar som gjorts
    sql_query = f'''
        SELECT COUNT(*)
        FROM guess
        WHERE game_id=%s;
    '''
    count = db_query(sql_query, True, (game_id,))
    if count >= 3:
        return { "status": "done" }

    # Generera ny
    correct_position = random.randint(1, 100_000_000_000)
    value = get_decimals(correct_position)
    sql_query = f'''
        INSERT INTO generated(user_id, value, position)
        VALUES
            (%s, %s, %s)
        RETURNING id;
    '''
    generated_id = db_exec(sql_query, True, (user_id, value, correct_position))

    # Skicka tillbaka
    return {
        "status": "ongoing",
        "index": f"{count}",
        "generated_id": generated_id,
        "value": value
    }


@app.get("/guess")
def endpoint_guess():
    user_id = request.args.get('user_id')
    game_id = request.args.get('game_id')
    generated_id = request.args.get('generated_id')
    guess = request.args.get('guess')

    # validera user+game
    sql_query = f'''
        SELECT COUNT(*)
        FROM game
        WHERE id=%s AND user_id=%s;
    '''
    count = db_query(sql_query, True, (game_id, user_id))
    if count != 1:
        return { "error": "invalid game" }, 400
    
    # TODO validera guess
    try:
        generated_id = int(generated_id)
        guess = int(float(guess))
    except (ValueError, AssertionError):
        return {"error": "invalid"}, 400

    # lägg till gissning
    try:
        sql_query = f'''
            INSERT INTO guess(generated_id, game_id, guess)
            VALUES
                (%s, %s, %s);
        '''
        db_exec(sql_query, False, (generated_id, game_id, guess))
    except psycopg2.errors.UniqueViolation:
        return { "error": "exists" }, 400 
       
    return {
        "status": "saved"
    }

@app.get("/stats")
def stats():
    # TODO returnera bra stats
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
        "latest_visit": latest_visit.strftime(r"%d/%m %H:%M:%S"),
    }

@app.get("/game_stats")
def endpoint_game_stats():
    game_id = request.args.get('game_id')

    # hämta stats från givet game_id
    sql_query = f'''
        SELECT 
            value, guess, position
        FROM
            guess
        INNER JOIN
            generated
        ON
            guess.generated_id=generated.id
        WHERE
            game_id=%s
        ORDER BY
            timestamp;
    '''
    results = db_query(sql_query, False, (game_id, ))

    score = get_score(game_id)

    return {
        "stats": [
            {
                "value": row[0],
                "guess": row[1],
                "position": row[2],
                "diff": abs(row[2] - row[1])
            }
            for row in results
        ],
        "score": float(score),
    }

@app.get("/dump")
def endpoint_dump():
    sql_query = '''
        SELECT
            users.id,
            users.displayname,
            generated.value,
            generated.position,
            guess.guess,
            game.id,
            guess.timestamp
        FROM
            guess
        INNER JOIN
            generated
        ON
            guess.generated_id = generated.id
        LEFT JOIN
            game
        ON
            guess.game_id = game.id
        LEFT JOIN
            users
        ON
            generated.user_id = users.id;
    '''

    results = db_query(sql_query)    

    return [
        {
            "user_id": result[0],
            "user_name": result[1],
            "decimals": result[2],
            "position": result[3],
            "guess": result[4],
            "game_id": result[5],
            "timestamp": result[6]
        }
        for result in results
    ]


@app.get("/highscore")
def highscore():
    game_id = request.args.get('game_id')

    sql_query = '''
        SELECT
            t2.game_id,
            users.displayname,
            users.timestamp,
            t2.score
        FROM
            game
        LEFT JOIN
            users
        ON
            game.user_id = users.id
        LEFT JOIN
        (
            SELECT
                guess.game_id AS game_id,
                SUM(ABS(guess.guess - generated.position)) AS score
            FROM
                guess
            INNER JOIN
                generated
            ON
                guess.generated_id = generated.id
            GROUP BY
                guess.game_id
        ) t2
        ON
            game.id = t2.game_id
        ORDER BY
            t2.score;
    '''

    results = db_query(sql_query)

    highscore = [
        {
            "game_id": result[0],
            "name": result[1],
            "timestamp": result[2].strftime(r"%d/%m %H:%M:%S"),
            "score": result[3],
            "index": index+1
        } 
        for index, result in enumerate(results[:10])
    ]

    if game_id != "null":
        if game_id not in [hs["game_id"] for hs in highscore]:
            index = 0
            for row in results:
                index += 1
                if row[0] == game_id:
                    highscore.append({
                        "game_id": row[0],
                        "name": row[1],
                        "timestamp": row[2].strftime(r"%d/%m %H:%M:%S"),
                        "score": row[3],
                        "index": index
                    })
                    break

    return {
        "highscore": highscore,
        "count": len(results)
    }
