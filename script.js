// Playing mechanism:
// - All of the HTML keys div in .piano are stored in a keys array
// - These keys will thus be indexed automatically from 0 (C3) to 24 (C5)
// - These indexes are be used to pick random notes and reference note

// - White keys and Black keys are also stored in each individual array
// - They will correspond to the computer keyboard White keys and Black keys array

// - When a key is played, the data set stored in each key will be converted
// to the corresponding audio ID to play

const keyboard = [ 
    {pianoKey: "C3", computerKey: "z"},
    {pianoKey: "Db3", computerKey: "s"},
    {pianoKey: "D3", computerKey: "x"},
    {pianoKey: "Eb3", computerKey: "d"},
    {pianoKey: "E3", computerKey: "c"},
    {pianoKey: "F3", computerKey: "v"},
    {pianoKey: "Gb3", computerKey: "g"},
    {pianoKey: "G3", computerKey: "b"},
    {pianoKey: "Ab3", computerKey: "h"},
    {pianoKey: "A3", computerKey: "n"},
    {pianoKey: "Bb3", computerKey: "j"},
    {pianoKey: "B3", computerKey: "m"},

    {pianoKey: "C4", computerKey: "q"},
    {pianoKey: "Db4", computerKey: "2"},
    {pianoKey: "D4", computerKey: "w"},
    {pianoKey: "Eb4", computerKey: "3"},
    {pianoKey: "E4", computerKey: "e"},
    {pianoKey: "F4", computerKey: "r"},
    {pianoKey: "Gb4", computerKey: "5"},
    {pianoKey: "G4", computerKey: "t"},
    {pianoKey: "Ab4", computerKey: "6"},
    {pianoKey: "A4", computerKey: "y"},
    {pianoKey: "Bb4", computerKey: "7"},
    {pianoKey: "B4", computerKey: "u"},
    {pianoKey: "C5", computerKey: "i"},
];

// Arrays of keys
const keys = document.querySelectorAll(".key");
const NUM_OF_NOTES = keys.length;

// Computer keyboard inputs
const COMPUTER_KEYS = ["z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", "q"];

//=====================================================================
// USER INPUT DETECTION

// Mouse Input
keys.forEach(key => {
    key.addEventListener("pointerdown", () => {
        
        // Translate note ID to audio ID and pass into callback
        let note = key.id.slice(0, -4);
        playPiano(note)
    })
})

// Computer Keyboard Input 
document.addEventListener("keydown", e => {

    // Safety check: don't repeat note if key is still pressed
    if (e.repeat) return;

    // Get the key pressed from the computer keyboard
    const computerKey = e.key;

    const computerKeyIndex = COMPUTER_KEYS.indexOf(computerKey);
    console.log(computerKeyIndex);

    note = keyboard[computerKeyIndex].pianoKey;
    playPiano(note);
})

//=====================================================================
// PIANO KEY FUNCTIONS

// The master play function, takes in a key div
function playPiano(key) {
    playNote(key);
    changeColor(key);
    if (gameStart == true) checkGuess(key);
}

// Play key sound
function playNote(note) {

    // Convert from key div name format to the corresponding audio tag
    const noteAudio = document.querySelector("#" + note + "-audio");
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
function changeColor(note) {

    // Find the key pressed
    let key = document.querySelector("#" + note + "-key");

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