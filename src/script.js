// =================
// UI elements

const nameInput = document.querySelector("#name");
const numberInput = document.querySelector("#sequence")
const statsParagraph = document.querySelector("#stats");
const highScoreTable = document.querySelector("#highscore table");
const rangeSelector = document.querySelector("#myRange")
const descriptor = document.querySelector("#descriptor")
const secondsdescriptor = document.querySelector("#secondsdescriptor")
const descSpan = document.querySelector("span#desc")
const valueSpan = document.querySelector("span#value")
const indexSpan = document.querySelector("span#index")
const scoreSpan = document.querySelector("span#gamescore")
const decimals = document.querySelector("#decimals span");

const ctrGame = document.querySelector("div#gamecontainer")
const ctrStart = document.querySelector("div#start")
const ctrGuess = document.querySelector("div#guess")
const ctrGamestats = document.querySelector("div#gamestats")
const ctrHighscore = document.querySelector("div#highscore")

const divBooks = document.querySelector("div#bookad");

const btnStart = document.querySelector("#start button");
const btnGuess = document.querySelector("#guess button")

// =================
// Game logic

var game_id = null;
var user_id = null;
let generated_id = null;
let generated_string = null;
let game_index = 0;
let logValue = 1;

// =================
// Post-game logic

let gameStats = {};
let highscore = {};
let stats = {};

// =================
// Helpers

function roundDecimals(number, precision) {
    let rounder = Math.pow(10, precision);
    return Math.round(number * rounder) / rounder;
}

function encodeQueryData(url, data) {
    const ret = [];
    for (let d in data)
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
    return url + "?" + ret.join('&');
 }

 function fillTable(selector, columns, data) {
    //console.log(selector, columns, data);

    const table = document.querySelector(selector);
    const rows = document.querySelectorAll(selector + " tr")
    for (let i=1; i<rows.length; i++) {
        rows[i].remove();
    }

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
        setTimeout(move, 10);
    }
}

move();

// =================
// Guess UI

function playAgain() {
    game_index=0;
    start();
}

// 4085039356541192

const TIME_MAPPING = [
    {
        maximum: 60*2,
        conversion: 1,
        decimals: 0,
        suffix: 'sekunder',
    },
    {
        maximum: 60*60*2,
        conversion: 60,
        decimals: 2,
        suffix: 'minuter'
    },
    {
        maximum: 60*60*24*2,
        conversion: 60*60,
        decimals: 2,
        suffix: 'timmar'
    },
    {
        maximum: 60*60*24*365,
        conversion: 60*60*24,
        decimals: 1,
        suffix: 'dygn'
    },
    {
        maximum: 60*60*24*14,
        conversion: 60*60*24*7,
        decimals: 1,
        suffix: 'veckor'
    },
    {
        maximum: 60*60*24*365*100,
        conversion: 60*60*24*365,
        decimals: 1,
        suffix: 'år'
    },
    {
        maximum: 60*60*24*365*100*100000,
        conversion: 60*60*24*365*100,
        decimals: 1,
        suffix: 'sekel'
    },
    {
        maximum: null,
        conversion: 60*60*24*365*65000000,
        decimals: 1,
        suffix: 'x tiden sedan dinosaurierna dog ut'
    },
]

const DISTANCE_MAPPING = [
    {
        maximum: 100,
        conversion: 1,
        decimals: 0,
        suffix: 'centimeter'
    },
    {
        maximum: 100*1000,
        conversion: 100,
        decimals: 1,
        suffix: 'meter'
    },
    {
        maximum: 100*1000*100,
        conversion: 100*1000,
        decimals: 1,
        suffix: 'kilometer'
    },
    {
        maximum: 100*1000*10*100,
        conversion: 100*1000*10,
        decimals: 1,
        suffix: 'mil'
    },
    {
        maximum: 100*1000*1600*100,
        conversion: 100*1000*1600,
        decimals: 1,
        suffix: 'x Sveriges längd från norr till söder'
    },
    {
        maximum: 100*1000*40075*5000,
        conversion: 100*1000*40075,
        decimals: 1,
        suffix: 'x jordens omkrets'
    },
    {
        maximum: 100*1000*148000000*10000,
        conversion: 100*1000*148000000,
        decimals: 1,
        suffix: 'x avståndet till solen'
    },
]

const MASS_MAPPING = [
    {
        maximum: 1000,
        conversion: 1,
        decimals: 0,
        suffix: 'gram'
    },
    {
        maximum: 1000*100,
        conversion: 1000,
        decimals: 2,
        suffix: 'kilogram'
    },
    {
        maximum: 1000*100*1,
        conversion: 1000*100,
        decimals: 2,
        suffix: 'jättepandor'
    },
    {
        maximum: 1000*1000*1000,
        conversion: 1000*1000,
        decimals: 2,
        suffix: 'ton'
    },
    {
        maximum: 1000*1000*7000*100,
        conversion: 1000*1000*7000,
        decimals: 1,
        suffix: 'eiffeltorn'
    },
    {
        maximum: null,
        conversion: 5896700810*1000,
        decimals: 3,
        suffix: 'gizapyramider'
    },
]

const MAPPINGS = [
    TIME_MAPPING, DISTANCE_MAPPING, MASS_MAPPING
]

function rangeInput() {
    logValue = Math.pow(1.003, rangeSelector.value);
    let baseValue = Math.round(logValue);

    if (game_index == 1) {
        descriptor.innerText = prettyOutput(logValue, TIME_MAPPING);
        secondsdescriptor.innerText = `(${baseValue} sekunder)`;
    }
    else if (game_index == 2) {
        descriptor.innerText = prettyOutput(logValue, DISTANCE_MAPPING);
        secondsdescriptor.innerText = `(${baseValue} centimeter)`;
    }
    else if (game_index == 3) {
        descriptor.innerText = prettyOutput(logValue, MASS_MAPPING);
        secondsdescriptor.innerText = `(${baseValue} gram)`;
    }
}

function prettyOutput(value, mapping) {
    for (const {maximum, conversion, decimals, suffix} of mapping) {
        if (maximum == null || value < maximum) {
            let prettyValue = roundDecimals(value / conversion, decimals);
            return `${prettyValue} ${suffix}`;
        }
    }
}

function updateUI() {
    console.log(game_index);
    ctrGame.classList.remove('faded');

    [ctrStart, ctrGuess, ctrGamestats, ctrHighscore].forEach(x => {
        x.classList.add("invisible");
    });

    if (game_index == 4) {
        ctrGamestats.classList.remove("invisible");
        let columns = ['value', 'guess', 'position'];
        // console.log(gameStats.stats);
        let index = 0;
        let stats = (gameStats.stats || []).map(({value, guess, position}) => {
            let prettyGuess = prettyOutput(guess, MAPPINGS[index]);
            let prettyCorrect = prettyOutput(position, MAPPINGS[index++]);
            return {
                value,
                position: prettyCorrect, // `${position}<br>(${prettyCorrect})`,
                guess: prettyGuess, //`${guess}<br>(${prettyGuess})`,
            }
        });
        fillTable('table#gamestats', columns, stats);
        scoreSpan.innerText = gameStats.score;
        return;
    }

    console.log('hello')

    if (game_index == 5) {
        console.log('what')
        ctrHighscore.classList.remove("invisible");
        let data = highscore.highscore;
        let columns = ['index', 'name', 'timestamp', 'score']
        console.log(data);
        fillTable('table#highscore tbody', columns, data);
        for (let i=0; i<data.length; i++) {
            if (data[i].game_id === game_id) {
                let my_row = document.querySelector(`table#highscore tbody tr:nth-child(${i+1})`);
                my_row.classList.add("my-result");
            }
        }
        return;
    }

    if (game_index <= 0) {
        ctrStart.classList.remove("invisible");
        return;
    }

    // Game info
    const descs = {
        1: 'Din värsta fiende läser upp \\(\\pi\\) för dig. Du får höra en decimal i taget, varje sekund. Hur länge måste du lyssna innan du hör',
        2: 'Kommunen ritar upp \\(\\pi\\) på vägen utanför ditt hus. Varje decimal tar bara upp bara en centimeter. Hur långt måste du vandra längs vägen innan du stöter på',
        3: 'En fågel hämtar ett litet sandkorn och lägger det i en hög framför dina fötter. Sandkornet väger bara 1 gram. Sedan piper den ut en decimal och hämtar ett nytt sandkorn. Hur mycket väger sandhögen när du hör',
    };
    descSpan.innerText = descs[game_index];
    valueSpan.innerText = generated_string; 
    indexSpan.innerText = game_index;
    ctrGuess.classList.remove("invisible");
    MathJax.typeset();
}

// ==================
// Gameplay

function editingName() {
    btnStart.disabled = nameInput.value.length < 3 && nameInput.value.length < 20;
}

function start() {
    const name = nameInput.value;
    const url = encodeQueryData('start', {name, user_id});
    ctrGame.classList.add('faded')
    btnStart.disabled = true;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            //console.log(data);
            game_id = data.game_id;
            user_id = data.user_id;            
        })
        .then(next)
        .finally(() => {
            btnStart.disabled = false;
        });    
}

function next() {
    const url = encodeQueryData('next', {
        user_id, game_id
    });
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            //console.log(data);

            game_index++;
            rangeSelector.value = 1;
            rangeInput();

            if (data.status == "done") {
                getGameStats();
                return;
            }
            generated_id = data.generated_id;
            generated_string = data.value;
            updateUI();
        });
}

function guess() {
    ctrGame.classList.add('faded')
    btnGuess.disabled = true;
    const guess = Math.round(logValue);

    const url = encodeQueryData('guess', {
        user_id, game_id, generated_id, guess
    });

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            //console.log(data);
        })
        .then(next)
        .finally(() => {
            btnGuess.disabled = false;
        });
}

// ==========================
// Stats and highscore

function toHighscore() {
    game_index++;
    getHighscore();
}

function getGameStats() {
    ctrGame.classList.add('faded')
    const url = encodeQueryData('game_stats', {game_id});

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            //console.log(data);
            gameStats = data;
        })
        .then(updateUI);
}

function getHighscore() {
    ctrGame.classList.add('faded')
    const url = encodeQueryData('highscore', {game_id});
    fetch(url)
        .then(response => response.json())
        .then((data) => {
            //console.log(data);
            highscore = data;
        })
        .then(updateUI);
}

updateUI();