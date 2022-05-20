//=====================================================================
//VIEW: alters the UI based on given inputs from MODEL and CONTROLLER
// feedback message 
// key colors
// key names

let view = {
    feedbackMessage: function() {
        
    }

}

//=====================================================================
// MODEL: the backend, generates random notes and manages guess status. 
// handles what happens when a note is played
// sends messages to VIEW feedback

let model = {

}

//=====================================================================
// CONTROLLER: lets user interact with the MODEL by guessing
// sends messages to VIEW

let controller = {

}

//=====================================================================
// EVENT HANDLERS & INIT
// detects user input to send over to CONTROLLER
// initializes page on load




























let isReference = false;

// Mapping the keyboard note to computer key
const KEYBOARD = [ 
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
    {note: "C5", computerKey: "i"}
];

// Arrays of keys on screen (aka key divs)
const KEYS = document.querySelectorAll(".key");
const NUM_OF_NOTES = KEYS.length;

// Computer keyboard inputs
const COMPUTER_KEYS = [
    "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", 
    "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i"
];

//=====================================================================
// USER INPUT DETECTION

// Mouse Input
KEYS.forEach(key => {
    key.addEventListener("pointerdown", () => {

        // Translate note ID to audio ID and pass into callback
        let note = key.id.slice(0, -4);
        playPiano(note)
    })
    isReference = false;
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
        note = KEYBOARD[computerKeyIndex].note;
        playPiano(note);
    }
    catch(err) {
    }
    isReference = false;
})

//=====================================================================
// PIANO KEY FUNCTIONS

// The master play function, takes in a note
function playPiano(note) {
    playSound(note);
    changeColor(note);
    if (isGuessing == true) checkGuess(note);
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
// GAMEPLAY 
const REFERENCE_PLAY = document.querySelector("#reference");
const REFERENCE_SELECT = document.querySelector("#reference-select");

const RANDOM = document.querySelector("#random");
const RANDOM_SELECT = document.querySelector("#num-of-random");
let numOfRandom = RANDOM_SELECT.value;

const SHUFFLE = document.querySelector("#shuffle");
let randomNoteIndexes = [];
let randomNoteIndexesCopy = []; // Keep a copy to show answer

let isGuessing = false;
let correctCount = 0;

let feedback1 = document.querySelector("#feedback1");
let feedback2 = document.querySelector("#feedback2");

function initGame() {
    initKeyNames();
    initFeedback();
    initReference();

    shuffleReference();
    shuffleRandomNotesArray();
}
initGame();

function initKeyNames() {
    for (let [i, key] of KEYS.entries()) {
        key.innerHTML = KEYBOARD[i].note;
    }
}

function initFeedback() {
    feedback1.innerHTML = "First, \"Play reference.\"";
    feedback2.innerHTML = "Then, \"Play random\" and select what you hear on the keyboard.";
}

function initReference() {
    for (let [i, key] of KEYBOARD.entries()) {
        let option = document.createElement("option");
        option.text = key.note,
        option.value = i;
        REFERENCE_SELECT.add(option);
    }
}

//=====================================================================
// REFERENCE BUTTONS BEHAVIOR

// Play reference note based on the reference index
REFERENCE_PLAY.addEventListener("click", () => {

    isReference = true;
    let referenceIndex = REFERENCE_SELECT.value;
    playPiano(KEYBOARD[referenceIndex].note);
})

//=====================================================================
// RANDOM BUTTONS BEHAVIOR

// Play the random note when clicked
RANDOM.addEventListener("click", () => {
    playRandom();
})

function playRandom() {

    isReference = false;
    isGuessing = true;

    // Play all the random notes in the array
    for (let i = 0; i < numOfRandom; ++i)
    {
        let keyRandom = KEYBOARD[randomNoteIndexesCopy[i]].note;
        playSound(keyRandom);
    }
}

// Figure out how many random notes the user wants
RANDOM_SELECT.addEventListener("change", () => {

    numOfRandom = RANDOM_SELECT.value;
    shuffleRandomNotesArray();
})

//=====================================================================
// SHUFFLE BUTTON BEHAVIOR

// Shuffle the random index
SHUFFLE.addEventListener("click", () => {
    shuffleAll();
})

function shuffleAll() {
    shuffleRandomNotesArray();
    shuffleReference();
    initFeedback();
    isGuessing = false;
}

function shuffleReference() {
    // Shuffle the reference note
    REFERENCE_SELECT.value = Math.floor(Math.random() * NUM_OF_NOTES);
}

// Generate n random indexes within the range of number of notes
function shuffleRandomNotesArray() {

    randomNoteIndexes = [];
    let randomIndex;

    // Randomize and assure unique numbers
    for (let i = 0; i < numOfRandom; ++i) {
        do {
            randomIndex = Math.floor(Math.random() * NUM_OF_NOTES);
        } while (randomNoteIndexes.includes(randomIndex) == true);

        randomNoteIndexes.push(randomIndex);
    }  

    randomNoteIndexesCopy = randomNoteIndexes.slice();
}

//=====================================================================
// SHOW ANSWER BUTTON BEHAVIOR

// Show answer
const ANSWER = document.querySelector("#answer");

ANSWER.addEventListener("click", () => {

    let answers = [];
    randomNoteIndexesCopy.sort((a,b) => a - b);

    // Play all the random notes in the array
    for (let i = 0; i < numOfRandom; ++i)
    {
        let keyRandom = KEYBOARD[randomNoteIndexesCopy[i]].note;
        playSound(keyRandom);
        changeColor(keyRandom);

        answers.push (KEYBOARD[randomNoteIndexesCopy[i]].note);
    }

    correctCount = 0;
    isGuessing = false;

    feedback1.innerHTML = answers;
    feedback2.innerHTML = "Keep trying!";
})

//=====================================================================
// GUESS CHECKING MECHANISM

function checkGuess(note) {
    
    if (isReference) return false;
    
    let keyIndex = KEYBOARD.findIndex(function(key) {
        return key.note === note;
    });

    // If guess is correct
    if (randomNoteIndexes.includes(keyIndex) == true) {
        correctCount += 1;
        let removeIndex = randomNoteIndexes.indexOf(keyIndex);
        randomNoteIndexes.splice(removeIndex, 1);

        // If that's the last guess => done
        if (correctCount == numOfRandom) {
            feedback1.innerHTML = "Great job!!!";
            feedback2.innerHTML = "Click \"Shuffle\" to get a new challenge."
            correctCount = 0;
            isGuessing = false;
        }
        // Else, tell how many more guesses to go
        else {
            feedback1.innerHTML = "Correct!";
            feedback2.innerHTML = (numOfRandom - correctCount) + " more to go!"
        } 
    } 

    // If guess is correct, but duplicated
    else if (randomNoteIndexesCopy.includes(keyIndex) == true) {
        feedback1.innerHTML = "Correct!";
        feedback2.innerHTML = "But you've already guessed it."
    } 
    
    // If guess is not correct
    else {
        feedback1.innerHTML = "Incorrect!";
        feedback2.innerHTML = "Let's try again.";
    }
}