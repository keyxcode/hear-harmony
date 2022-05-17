// Playing mechanism:
// - All of the HTML keys div in .piano are stored in a keys array
// - These keys will thus be indexed automatically from 0 (C3) to 24 (C5)
// - These indexes are be used to pick random notes and reference note

// - White keys and Black keys are also stored in each individual array
// - They will correspond to the computer keyboard White keys and Black keys array

// - When a key is played, the data set stored in each key will be converted
// to the corresponding audio ID to play

let keyboard = [ 
    {pianoKey: "C3", computerKey: "z", value: 0},
    {pianoKey: "Db3", computerKey: "s", value: 1},
    {pianoKey: "D3", computerKey: "x", value: 2},
    {pianoKey: "Eb3", computerKey: "d", value:3},
    {pianoKey: "E3", computerKey: "c", value:4},
    {pianoKey: "F3", computerKey: "v", value:5},
    {pianoKey: "Gb3", computerKey: "g", value:6},
    {pianoKey: "G3", computerKey: "b", value: 7},
    {pianoKey: "Ab3", computerKey: "h", value: 8},
    {pianoKey: "A3", computerKey: "n", value: 9},
    {pianoKey: "Bb3", computerKey: "j", value: 10},
    {pianoKey: "B3", computerKey: "m", value: 11},
    {pianoKey: "C4", computerKey: "q", value: 12},
];

// Arrays of keys
const keys = document.querySelectorAll(".key");
const whiteKeys = document.querySelectorAll(".key.white");
const blackKeys = document.querySelectorAll(".key.black");
const NUM_OF_NOTES = 25;

// Computer keyboard inputs
const WHITE_KEYS = ["z", "x", "c", "v", "b", "n", "m", "q", "w", "e", "r", "t", "y", "u", "i"];
const BLACK_KEYS = ["s", "d", "g", "h", "j", "2", "3", "5", "6", "7"];

//=====================================================================
// USER INPUT DETECTION

// Mouse Input - callback playPiano()
keys.forEach(key => {
    key.addEventListener("pointerdown", () => playPiano(key))
})

// Computer Keyboard Input - callback playPiano()
document.addEventListener("keydown", e => {

    // Safety check: don't repeat note if key is still pressed
    if (e.repeat) return;

    // Get the key pressed from the computer keyboard
    const computerKey = e.key;

    const whiteKeyIndex = WHITE_KEYS.indexOf(computerKey);
    const blackKeyIndex = BLACK_KEYS.indexOf(computerKey);

    if (whiteKeyIndex > -1) playPiano(whiteKeys[whiteKeyIndex]);
    if (blackKeyIndex > -1) playPiano(blackKeys[blackKeyIndex]);
})

//=====================================================================
// PIANO KEY FUNCTIONS

// The master play function, takes in a key
function playPiano(key) {
    playNote(key);
    changeColor(key);
    if (gameStart == true) checkGuess(key);
}

// Play key sound
function playNote(key) {

    // Get the note name
    const note = key.dataset.note;

    // Get the note audio
    const noteAudio = document.querySelector("#" + note);
    
    // Reset the current time to 0 each time the key is pressed
    noteAudio.currentTime = 0;

    // Play the audio
    noteAudio.play();

    // Pause audio when pointer is up
    document.addEventListener("pointerup", () => {
        noteAudio.pause();
    })

    // Pause audio when computer keyboard is up
    document.addEventListener("keyup", () => {
        noteAudio.pause();
    })
}

// Change key color
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
let randomArrayCopy = [];
let gameStart = false;
let correctCount = 0;

referenceIndex = parseInt((Math.random() * 100)) % NUM_OF_NOTES;
referenceNote.value = referenceIndex;

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
    shuffleNoteArray();
    console.log(numOfRandom);
})

// Shuffle the random index
shuffle.addEventListener("click", () => {
    shuffleEverything();
})

function shuffleEverything() {
    shuffleNoteArray();
    shuffleReference();
    initFeedback();
    gameStart = true;
}

function shuffleReference() {

    // Shuffle the reference note
    referenceIndex = parseInt((Math.random() * 100)) % NUM_OF_NOTES;
    referenceNote.value = referenceIndex;
}

// Generate n random indexes within the range of number of notes
function shuffleNoteArray() {
    
    // Clear the random array
    randomArray = [];

    for (let i = 0; i < numOfRandom; ++i) {
        do { // assures unique numbers
            randomIndex = parseInt((Math.random() * 100)) % NUM_OF_NOTES;
        } while (randomArray.includes(randomIndex) == true);

        randomArray.push(randomIndex);
    }  

    randomArrayCopy = randomArray.slice();
    console.log(randomArray);
    console.log(randomArrayCopy);
}

// Play the random note when clicked
random.addEventListener("click", () => {
    playRandom();
})

function playRandom() {

    if (randomIndex == null) {
        shuffleNoteArray();
    }

    gameStart = true;

    // Play all the random notes in the array
    for (let i = 0; i < numOfRandom; ++i)
    {
        let keyRandom = keys[randomArrayCopy[i]];
        playNote(keyRandom);
    }
}

// Show answer
const answer = document.querySelector("#answer");
answer.addEventListener("click", () => {
    var answers = randomArrayCopy.map((index) => {
        return keys[index].dataset.note;
    })

    // Play all the random notes in the array
    for (let i = 0; i < numOfRandom; ++i)
    {
        let keyRandom = keys[randomArrayCopy[i]];
        playNote(keyRandom);
        changeColor(keyRandom);
    }

    correctCount = 0;

    gameStart = false;

    feedback1.innerHTML = answers;
    feedback2.innerHTML = "Keep trying!";
})

let feedback1 = document.querySelector("#feedback1");
let feedback2 = document.querySelector("#feedback2");

function initFeedback() {
    feedback1.innerHTML = "First, \"Play reference.\"";
    feedback2.innerHTML = "Then, \"Play random\" and select what you hear on the keyboard.";
}

initFeedback();

// Check guess mechanism
function checkGuess(key) {
        
    let keyIndex = (Array.from(keys)).indexOf(key);

    if (randomArray.includes(keyIndex) == true) {
        correctCount += 1;
        let removeIndex = randomArray.indexOf(keyIndex);
        randomArray.splice(removeIndex, 1);

        if (correctCount == numOfRandom) {
            feedback1.innerHTML = "Great job!!!";
            feedback2.innerHTML = "Click \"Shuffle\" to get a new challenge."
            correctCount = 0;
            gameStart = false;
        }
        else {
            feedback1.innerHTML = "Correct!";
            feedback2.innerHTML = (numOfRandom - correctCount) + " more to go!"
        } 
    } 

    else if (randomArrayCopy.includes(keyIndex) == true) {
        feedback1.innerHTML = "Correct!";
        feedback2.innerHTML = "But you've already guessed it."
    } 
    
    else {
        feedback1.innerHTML = "Incorrect!";
        feedback2.innerHTML = "Let's try again.";
    }

}