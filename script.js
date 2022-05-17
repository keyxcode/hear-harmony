// Playing mechanism:
// - All of the HTML keys div in .piano are stored in a keys array
// - These keys will thus be indexed automatically from 0 (C3) to 24 (C5)
// - These indexes are be used to pick random notes and reference note

// - White keys and Black keys are also stored in each individual array
// - They will correspond to the computer keyboard White keys and Black keys array

// - When a key is played, the data set stored in each key will be converted
// to the corresponding audio ID to play

const keyboard = [ 
    {note: "C3", computerKey: "z"},
    {note: "Db3", computerKey: "s"},
    {note: "D3", computerKey: "x"},
    {note: "Eb3", computerKey: "d"},
    {note: "E3", computerKey: "c"},
    {note: "F3", computerKey: "v"},
    {note: "Gb3", computerKey: "g"},
    {note: "G3", computerKey: "b"},
    {note: "Ab3", computerKey: "h"},
    {note: "A3", computerKey: "n"},
    {note: "Bb3", computerKey: "j"},
    {note: "B3", computerKey: "m"},

    {note: "C4", computerKey: "q"},
    {note: "Db4", computerKey: "2"},
    {note: "D4", computerKey: "w"},
    {note: "Eb4", computerKey: "3"},
    {note: "E4", computerKey: "e"},
    {note: "F4", computerKey: "r"},
    {note: "Gb4", computerKey: "5"},
    {note: "G4", computerKey: "t"},
    {note: "Ab4", computerKey: "6"},
    {note: "A4", computerKey: "y"},
    {note: "Bb4", computerKey: "7"},
    {note: "B4", computerKey: "u"},
    {note: "C5", computerKey: "i"},
];

// Arrays of keys
const keys = document.querySelectorAll(".key");
const NUM_OF_NOTES = keys.length;

// Computer keyboard inputs
const COMPUTER_KEYS = [
    "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", 
    "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i"
];

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

    // Get the note from the piano list of objects
    try {
        note = keyboard[computerKeyIndex].note;
        playPiano(note);
    }
    catch(err) {
    }
})

//=====================================================================
// PIANO KEY FUNCTIONS

// The master play function, takes in a note
function playPiano(note) {
    playSound(note);
    changeColor(note);
    if (gameStart == true) checkGuess(note);
}

// Play key sound
function playSound(note) {
    // Convert from note format to the corresponding audio tag
    const noteAudio = document.querySelector("#" + note + "-audio");
    noteAudio.currentTime = 0;
    
    noteAudio.play();

    // Pause audio when...
    document.addEventListener("pointerup", () => {
        noteAudio.pause();
    })
    document.addEventListener("keyup", () => {
        noteAudio.pause();
    })
}

// Change key color
function changeColor(note) {

    // Find the key on screen and change its class
    let key = document.querySelector("#" + note + "-key");
    key.classList.add("active");
    
    // Reset key color when...
    document.addEventListener("pointerup", () => {
        key.classList.remove("active");
    })
    document.addEventListener("keyup", () => {
        key.classList.remove("active");
    })
}

//=====================================================================
// EXPERIMENTAL

const REFERENCE_PLAY = document.querySelector("#reference");
const REFERENCE_SELECT = document.querySelector("#reference-select");
let referenceIndex;
let gameStart;

const RANDOM = document.querySelector("#random");
const RANDOM_SELECT = document.querySelector("#num-of-random");
let numOfRandom = RANDOM_SELECT.value;

function initGame() {
    gameStart = false;

    referenceIndex = Math.floor(Math.random() * NUM_OF_NOTES);
    REFERENCE_SELECT.value = referenceIndex;
}
initGame();

// Figure out the reference index user selects
REFERENCE_SELECT.addEventListener("change", () => {
    referenceIndex = REFERENCE_SELECT.value;
})

// Play reference note based on the reference index
REFERENCE_PLAY.addEventListener("click", () => {
    playPiano(keyboard[referenceIndex].note);
})

// Play the random note when clicked
RANDOM.addEventListener("click", () => {
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
        playSound(keyRandom);
    }
}


const shuffle = document.querySelector("#shuffle");
let randomIndex;
let randomArray = [];
let randomArrayCopy = [];
let correctCount = 0;

// Figure out how many random notes the user wants
RANDOM_SELECT.addEventListener("change", () => {
    numOfRandom = RANDOM_SELECT.value;
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
    REFERENCE_SELECT.value = referenceIndex;
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
        playSound(keyRandom);
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