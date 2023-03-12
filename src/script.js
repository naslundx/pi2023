const nameInput = document.querySelector("#name");
const numberInput = document.querySelector("#sequence")
const statsParagraph = document.querySelector("#stats");
const highScoreTable = document.querySelector("#highscore table");
const rangeSelector = document.querySelector("#myRange")
const timeDescriptor = document.querySelector("#timedescriptor")
const valueSpan = document.querySelector("#value")

var generated_id = null;
var user_id = null;

function rangeInput() {
    timeDescriptor.innerText = prettyTimeOutput(rangeSelector.value);
}

function prettyTimeOutput(seconds) {
    if (seconds < 60) {
        return `${seconds} sekunder`
    }
    const totalMs = seconds * 1000;
    const result = new Date(totalMs).toISOString().slice(11, 19);

    return result;
}

function generate() {
    fetch('generate')
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            generated_id = data.generated_id;
            user_id = data.user_id;
            valueSpan.innerText = data.value;
        });
}

generate();

function submitGuess() {
    const name = nameInput.value;
    const guess = rangeSelector.value;

    fetch(`guess?user_id=${user_id}&generated_id=${generated_id}&name=${name}&guess=${guess}`)
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            showScores();
        });
}

function showStats() {
    fetch('stats')
        .then((response) => response.json())
        .then((data) => {
            console.log(data);
            user_count = data['user_count']
            latest_visit = data['latest_visit']
            statsParagraph.innerText = `${user_count} deltagare, senast ${latest_visit}.`
        });
}

showStats();

function showScores() {
    fetch('scores')
        .then(response => response.json())
        .then(updateTable);
}

showScores();

function updateTable(data) {
    console.log(data);
    tableContents = `
        <tr>
        <th></th>
        <th>Namn</th>
        <th>Sekvens</th>
        <th>Gissade</th>
        <th>Rätt svar</th>
        <th>Diff</th>
        <th>När</th>
        </tr>
    `;
    let index = 1;
    data.forEach(row => {
        tableContents += `
            <tr>
            <td>${index++}</td>
            <td>${row.name}</td>
            <td>${row.value}</td>
            <td>${row.correct}</td>
            <td>${row.guess}</td>
            <td>${Math.abs(row.correct - row.guess)}</td>
            <td>${row.timestamp}</td>
            </tr>
        `;
    });
    highScoreTable.innerHTML = tableContents;
}
