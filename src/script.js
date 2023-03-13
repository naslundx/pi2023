// =================
// UI elements

const nameInput = document.querySelector("#name");
const numberInput = document.querySelector("#sequence")
const statsParagraph = document.querySelector("#stats");
const highScoreTable = document.querySelector("#highscore table");
const rangeSelector = document.querySelector("#myRange")
const timeDescriptor = document.querySelector("#timedescriptor")
const descSpan = document.querySelector("span#desc")
const valueSpan = document.querySelector("span#value")
const indexSpan = document.querySelector("span#index")
const scoreSpan = document.querySelector("span#gamescore")
const decimals = document.querySelector("#decimals span");

const ctrStart = document.querySelector("div#start")
const ctrGuess = document.querySelector("div#guess")
const ctrGamestats = document.querySelector("div#gamestats")
const ctrHighscore = document.querySelector("div#highscore")

// =================
// Game logic

var game_id = null;
var user_id = null;
let generated_id = null;
let generated_string = null;
let game_index = 0;

// =================
// Post-game logic

let gameStats = {};
let highscore = {};
let stats = {};

// =================
// Helpers

function encodeQueryData(url, data) {
    const ret = [];
    for (let d in data)
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    return url + "?" + ret.join('&');
 }

 function fillTable(selector, columns, data) {
    console.log(selector, columns, data);

    const table = document.querySelector(selector);
    const rows = document.querySelectorAll(selector + " tr:not(:first-child)")
    rows.forEach(row => row.remove());

    data.forEach(item => {
        let newRow = '<tr>';
        columns.forEach(column => {
            newRow += '<td>' + item[column] + '</td>';
        })
        newRow += '</tr>';
        table.innerHTML += newRow;
    });
 }

// =================
// Decimals animation

let decimalOffset = window.innerWidth + 5;
let animateDecimals = true;

function move() {
    decimalOffset--;
    decimals.style.marginLeft = decimalOffset + "px";
    if (animateDecimals) {
        setTimeout(move, 20);
    }
}

move();

// =================
// Guess UI

function rangeInput() {
    timeDescriptor.innerText = prettyTimeOutput(rangeSelector.value);
}

function playAgain() {
    game_index=0;
    start();
}

function prettyTimeOutput(seconds) {
    // TODO depend on type

    if (seconds < 60) {
        return `${seconds} sekunder`
    }
    const totalMs = seconds * 1000;
    const result = new Date(totalMs).toISOString().slice(11, 19);

    return result;
}

function updateUI() {
    console.log(game_index);

    [ctrStart, ctrGuess, ctrGamestats, ctrHighscore].forEach(x => {
        x.classList.add("invisible");
    });

    if (game_index == 4) {
        ctrGamestats.classList.remove("invisible");
        fillTable('table#gamestats', ['value', 'guess', 'position'], gameStats.stats);
        scoreSpan.innerText = gameStats.score;
        return;
    }

    if (game_index == 5) {
        ctrHighscore.classList.remove("invisible");
        fillTable('table#highscore', ['name', 'timestamp', 'score'], highscore.highscore);
        return;
    }

    if (game_index <= 0) {
        ctrStart.classList.remove("invisible");
        return;
    }

    // Game info
    const descs = {
        1: 'Om du hör en decimal varje sekund, hur länge måste du vänta innan du hör',
        2: 'Om du går en meter för varje decimal, hur långt måste du gå innan du hör',
        3: 'yada yada yada',
    };
    descSpan.innerText = descs[game_index];
    valueSpan.innerText = generated_string; 
    indexSpan.innerText = game_index;
    ctrGuess.classList.remove("invisible");
}

// ==================
// Gameplay

function start() {
    const name = nameInput.value;
    const url = encodeQueryData('start', {name, user_id});

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            game_id = data.game_id;
            user_id = data.user_id;            
        })
        .then(next);    
}

function next() {
    const url = encodeQueryData('next', {
        user_id, game_id
    });
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            game_index++;
            console.log(data);
            if (data.status == "done") {
                getGameStats();
                return;
            }
            generated_id = data.generated_id;
            generated_string = data.value;
        })
        .then(updateUI);
}

function guess() {
    const guess = rangeSelector.value;

    const url = encodeQueryData('guess', {
        user_id, game_id, generated_id, guess
    });

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
        })
        .then(next);

}

// ==========================
// Stats and highscore

function toHighscore() {
    game_index++;
    getHighscore();
}

function getGameStats() {
    const url = encodeQueryData('game_stats', {game_id});

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            gameStats = data;
        })
        .then(updateUI);
}

function getHighscore() {
    fetch('highscore')
        .then(response => response.json())
        .then((data) => {
            console.log(data);
            highscore = data;
        })
        .then(updateUI);
}

