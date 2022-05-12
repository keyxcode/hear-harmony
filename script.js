// Array of keys
const keys = document.querySelectorAll(".key");
const whiteKeys = document.querySelectorAll(".key.white");
const blackKeys = document.querySelectorAll(".key.black");

// Keyboard buttons
const WHITE_KEYS = ["z", "x", "c", "v", "b", "n", "m", ","];
const BLACK_KEYS = ["s", "d", "g", "h", "j"];

//=====================================================================
// Detect mouse mechanism
keys.forEach(key => {
    key.addEventListener("pointerdown", () => playPiano(key))
})

// Detect keyboard mechanism
document.addEventListener("keydown", e => {

    // Safety check: don't repeat note if key is still pressed
    if (e.repeat) return;

    // Get the key pressed from the computer keyboard
    const key = e.key;

    // Get the potential index of the key
    const whiteKeyIndex = WHITE_KEYS.indexOf(key);
    const blackKeyIndex = BLACK_KEYS.indexOf(key);

    // -1 is returned when indexOf can't find anything
    if (whiteKeyIndex > -1) playPiano(whiteKeys[whiteKeyIndex]);
    if (blackKeyIndex > -1) playPiano(blackKeys[blackKeyIndex]);
})

function playPiano(key) {
    playNote(key);
    changeColor(key);
    if (gameStart == true) checkGuess(key);
}

function playNote(key) {

    // Get the note name
    const note = key.dataset.note;

    // Get the note audio
    const noteAudio = document.querySelector("#" + note);
    
    // Reset the current time to 0 each time the key is pressed
    noteAudio.currentTime = 0;

    // Play the audio
    noteAudio.play();

}

function changeColor(key) {

    // Add an active class to our key
    key.classList.add("active");
    
    // Reset key color when pointer is up
    document.addEventListener("pointerup", () => {
        key.classList.remove("active");
    })

    // Or reset key color when computer keyboard is up
    document.addEventListener("keyup", () => {
        key.classList.remove("active");
    })
}

//=====================================================================
// EXPERIMENTAL

const referencePlay = document.querySelector("#reference");
const referenceNote = document.querySelector("#reference-note");
let referenceIndex = referenceNote.value;
const random = document.querySelector("#random");
const randomSelect = document.querySelector("#num-of-random");
let numOfRandom = randomSelect.value;
const shuffle = document.querySelector("#shuffle");
let randomIndex;
let randomArray = [];
let gameStart = false;

// Figure out the reference index user selects
referenceNote.addEventListener("change", () => {
    referenceIndex = referenceNote.value;
})

// Play reference note based on the reference index
referencePlay.addEventListener("click", () => {
    playNote(keys[referenceIndex]);
})

// Figure out how many random notes the user wants
randomSelect.addEventListener("change", () => {
    numOfRandom = randomSelect.value;
    console.log(numOfRandom);
})

// Shuffle the random index
shuffle.addEventListener("click", () => {
    shuffleRandom();
})

function shuffleRandom() {
    
    randomIndex = parseInt((Math.random() * 100)) % 26;
}

random.addEventListener("click", () => {
    playRandom();
})

function playRandom() {

    if (randomIndex == null) {
        randomIndex = parseInt((Math.random() * 100)) % 26;
    }

    gameStart = true;

    let keyRandom = keys[randomIndex];
    playNote(keyRandom);
}

function checkGuess(key) {
    let keyRandom = keys[randomIndex];

    if (key == keyRandom) {
        alert("Correct!");
        return true;
    } 

    else alert("Please try again");
}