// Array of keys
const keys = document.querySelectorAll(".key");
const whiteKeys = document.querySelectorAll(".key.white");
const blackKeys = document.querySelectorAll(".key.black");
const NUM_OF_NOTES = 25;

// Keyboard buttons
const WHITE_KEYS = ["z", "x", "c", "v", "b", "n", "m", "q", "w", "e", "r", "t", "y", "u", "i"];
const BLACK_KEYS = ["s", "d", "g", "h", "j", "2", "3", "5", "6", "7"];

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

    // Pause audio when pointer is up
    document.addEventListener("pointerup", () => {
        noteAudio.pause();
    })

    // Pause audio when computer keyboard is up
    document.addEventListener("keyup", () => {
        noteAudio.pause();
    })

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
    feedback1.innerHTML = "First, click \"Play reference note.\"";
    feedback2.innerHTML = "Then, click \"Play random notes\" and play your guess on the keyboard.";
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

let feedback1 = document.querySelector("#feedback1");
let feedback2 = document.querySelector("#feedback2");

// Check guess mechanism
function checkGuess(key) {
        
    let keyIndex = (Array.from(keys)).indexOf(key);

    if (randomArray.includes(keyIndex) == true) {
        correctCount += 1;
        let removeIndex = randomArray.indexOf(keyIndex);
        randomArray.splice(removeIndex, 1);

        console.log(correctCount);
        console.log(numOfRandom);

        if (correctCount == numOfRandom) {
            feedback1.innerHTML = "Great job!";
            feedback2.innerHTML = "Click \"Shuffle\" to get a new challenge."
            correctCount = 0;
        }
        else {
            feedback1.innerHTML = "Correct!";
            feedback2.innerHTML = (numOfRandom - correctCount) + " more to go!"
            console.log(randomArray);
            console.log(randomArrayCopy);
        } 
    } 

    else if (randomArrayCopy.includes(keyIndex) == true) {
        feedback1.innerHTML = "Correct!";
        feedback2.innerHTML = "But you've already guessed it."
    } 
    
    else {
        feedback1.innerHTML = "Incorrect!";
        feedback2.innerHTML = "Let's try again."
    }
}