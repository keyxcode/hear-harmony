// GLOBAL VARS:
const REFERENCE_PLAY = document.querySelector("#reference");
const REFERENCE_SELECT = document.querySelector("#reference-select");

const RANDOM_PLAY = document.querySelector("#random");
const RANDOM_SELECT = document.querySelector("#num-of-random");

const SHUFFLE = document.querySelector("#shuffle");
const ANSWER = document.querySelector("#answer");

// Array of note name conventions
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

// Array of HTML audios
const KEYS_AUDIOS = document.querySelectorAll("audio");

// Array of Computer keys
const COMPUTER_KEYS = [
    "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", 
    "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i"
];

//=====================================================================
//VIEW: alters the UI based on given inputs from MODEL and CONTROLLER
// feedback message 
// key colors
// play sound
// key names

let view = {
    feedbackMessage1: function(msg) {
        let feedback1 = document.querySelector("#feedback1");
        feedback1.innerHTML = msg;
    },

    feedbackMessage2: function(msg) {
        let feedback2 = document.querySelector("#feedback2");
        feedback2.innerHTML = msg;
    },

    // ideally conversion from string "A3" -> num 
    // should take place elsewhere
    playPiano: function(id) {
        this.playNote(id);
        this.changeNoteColor(id);
    },

    playNote: function(id) {
        let noteAudio = KEYS_AUDIOS[id];
        noteAudio.currentTime = 0;
        noteAudio.play();
    },

    changeNoteColor: function(id) {
        let key = KEYS[id];
        key.classList.add("active");
    },

    // Pause everything
    stopAudioVisual: function() {
        document.querySelectorAll("audio").forEach(el => el.pause());
        document.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
    }
}

//=====================================================================
// MODEL: the backend, generates random notes and manages guess status. 
// Processes note as number indexes (0 -> 25)
// handles what happens when a note is played
// sends messages to VIEW feedback

let model = {
    randomNoteIndexes: [],
    randomNoteIndexesCopy: [],
    numOfRandom: parseInt(RANDOM_SELECT.value),
    correctCount: 0,
    isKey: false,
    isGuessing: false,

    shuffleAll: function () {
        this.shuffleRandomNotesArray();
        this.shuffleReference();
        initFeedback();
    },

    shuffleReference: function() {
        REFERENCE_SELECT.value = Math.floor(Math.random() * NUM_OF_NOTES);
    },
    
    // Generate n random indexes within the range of number of notes
    shuffleRandomNotesArray: function() {
    
        this.randomNoteIndexes = [];
        let randomIndex;
    
        // Randomize and assure unique numbers
        for (let i = 0; i < this.numOfRandom; ++i) {
            do {
                randomIndex = Math.floor(Math.random() * NUM_OF_NOTES);
            } while (this.randomNoteIndexes.includes(randomIndex) === true);
    
            this.randomNoteIndexes.push(randomIndex);
        }  
    
        this.randomNoteIndexesCopy = this.randomNoteIndexes.slice();
    },

    // refactor this to take in number instead
    checkGuess: function(id) {
        if (!this.isKey || !this.isGuessing) return false;
    
        // If guess is correct
        if (this.randomNoteIndexes.includes(id) === true) {
            this.correctCount += 1;
            let removeIndex = this.randomNoteIndexes.indexOf(id);
            this.randomNoteIndexes.splice(removeIndex, 1);
    
            // If that's the last guess => done
            if (this.correctCount === this.numOfRandom) {
                view.feedbackMessage1("Great job!!!");
                view.feedbackMessage2("Click \"Shuffle\" to get a new challenge.");
                this.correctCount = 0;
                this.isGuessing = false;
            }
            // Else, tell how many more guesses to go
            else {
                view.feedbackMessage1("Correct!");
                view.feedbackMessage2((this.numOfRandom - this.correctCount) + " more to go!");
            } 
        } 
    
        // If guess is correct, but duplicated
        else if (this.randomNoteIndexesCopy.includes(id) === true) {
            view.feedbackMessage1("Correct!");
            view.feedbackMessage2("But you've already guessed it.");
        } 
        
        // If guess is not correct
        else {
            view.feedbackMessage1("Incorrect!");
            view.feedbackMessage2("Let's try again.");
        }
    },
}

//=====================================================================
// CONTROLLER: lets user interact with the MODEL by guessing
// sends messages to VIEW
// Process key and mouse input and turn them into integers 0->27

let controller = {
    parseMouseInput: function(e) {
        let id = (Array.from(KEYS)).indexOf(e.target);
        model.isKey = true;
        model.checkGuess(id);
        view.playPiano(id);
    },

    parseKeyInput: function(e) {
        // Safety check: don't repeat note if key is still pressed
        if (e.repeat) return;

        // Get the key pressed from the computer keyboard
        const computerKey = e.key;
        let id = COMPUTER_KEYS.indexOf(computerKey);
        if (id === -1) return false;

        model.checkGuess(id);
        view.playPiano(id);
    },
}

//=====================================================================
// EVENT HANDLERS
// detects user input to send over to CONTROLLER

// Mouse Input Detection
KEYS.forEach(key => {
    key.addEventListener("pointerdown", (e) => controller.parseMouseInput(e))
});

document.addEventListener("pointerup", () => view.stopAudioVisual());

// Computer Keyboard Input Detection
document.addEventListener("keydown", (e) => controller.parseKeyInput(e));

document.addEventListener("keyup", () => {
    view.stopAudioVisual();
})

// Utility buttons
REFERENCE_PLAY.addEventListener("click", () => {

    let id = REFERENCE_SELECT.value;
    model.isKey = false;
    view.playPiano(id);
})

RANDOM_PLAY.addEventListener("click", () => {
    playRandom();
    model.isKey = false;
})

function playRandom() {

    model.isGuessing = true;

    // Play all the random notes in the array
    for (let i = 0; i < model.numOfRandom; ++i)
    {
        let id = model.randomNoteIndexesCopy[i];
        view.playNote(id);
    }
}

RANDOM_SELECT.addEventListener("change", () => {

    model.numOfRandom = RANDOM_SELECT.value;
    model.shuffleRandomNotesArray();
    model.numOfRandom = parseInt(RANDOM_SELECT.value);
})

SHUFFLE.addEventListener("click", () => {
    model.shuffleAll();
})

ANSWER.addEventListener("click", () => {

    let answers = [];
    model.randomNoteIndexesCopy.sort((a,b) => a - b);

    // Play all the random notes in the array
    for (let i = 0; i < model.numOfRandom; ++i)
    {
        let id = model.randomNoteIndexesCopy[i];
        view.playNote(id);
        view.changeNoteColor(id);

        answers.push (KEYBOARD[id].note);
    }

    model.correctCount = 0;
    model.isKey = false;
    model.isGuessing = false;

    view.feedbackMessage1(answers);
    view.feedbackMessage2("Keep trying!");
})

//=====================================================================
// INIT
// initializes page on load

window.addEventListener("load", initGame);
function initGame() {
    initKeyNames();
    initFeedback();
    initReference();

    model.shuffleReference();
    model.shuffleRandomNotesArray();
}

function initKeyNames() {
    for (let [i, key] of KEYS.entries()) {
        key.innerHTML = KEYBOARD[i].note;
    }
}

function initFeedback() {
    view.feedbackMessage1("First, \"Play reference.\"");
    view.feedbackMessage2 ("Then, \"Play random\" and select what you hear on the keyboard.");
}

function initReference() {
    for (let [i, key] of KEYBOARD.entries()) {
        let option = document.createElement("option");
        option.text = key.note,
        option.value = i;
        REFERENCE_SELECT.add(option);
    }
}