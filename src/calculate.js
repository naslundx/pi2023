let darts = [];
const square = document.querySelector("#square");
const cursor = document.querySelector("#cursor");
const R = 500 / 2;
let showCursor = true;

let insideCount = 0;
let outsideCount = 0;

const spanInside = document.querySelector("span#inside");
const spanOutside = document.querySelector("span#outside");
const spanTotal = document.querySelector("span#total");
const spanRatio = document.querySelector("span#ratio");
const spanPiApprox = document.querySelector("span#piapprox");


function isInside(x, y) {
    return Math.sqrt(x**2 + y**2) < 1;
}

function createRandomDart() {
    let x = Math.random() * 2 - 1;
    let y = Math.random() * 2 - 1;
    let inside = isInside(x, y);
    let dart = { x, y, inside };
    if (inside) {
        insideCount++;
    } else {
        outsideCount++;
    }
    console.log(dart);
    darts.push(dart);

    let left = (1 + x) * R - 1;
    let top = (1 + y) * R - 1; 
    square.innerHTML += `<div class="dart" style="left:${left}px;top:${top}px"></div>`;

    return dart;
}

document.onmousemove=function(e) {
    cursor.style.left = (e.clientX + window.scrollX) + 'px';
    cursor.style.top = (e.clientY + window.scrollY) + 'px';
};

function updateUi() {
    let total = insideCount + outsideCount;
    let ratio = total > 0 ? insideCount / total : 0;
    spanInside.innerText = insideCount;
    spanOutside.innerText = outsideCount;
    spanTotal.innerText = total;
    spanRatio.innerText = ratio;
    spanPiApprox.innerText = 4*ratio;
}

function throwDart() {
    if (!showCursor) {
        return;
    }

    showCursor = false;
    cursor.classList.add('hidden');
    setTimeout(() => {
        createRandomDart();
        showCursor = true;
        cursor.classList.remove('hidden');
        updateUi();
    }, 100)
}

square.onclick=throwDart;

