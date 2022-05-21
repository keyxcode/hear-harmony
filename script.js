// GLOBAL VARS:
const REFERENCE_PLAY = document.querySelector("#reference");
const REFERENCE_SELECT = document.querySelector("#reference-select");

const RANDOM_PLAY = document.querySelector("#random");
const RANDOM_SELECT = document.querySelector("#num-of-random");

const SHUFFLE = document.querySelector("#shuffle");
const ANSWER = document.querySelector("#answer");

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
    playPiano: function(note) {
        view.playSound(note);
        view.changeColor(note);

        // this line should prob be in controller?
        model.checkGuess(note);
    },

    playSound: function(note) {
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
    },

    changeColor: function (note) {

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
}

//=====================================================================
// MODEL: the backend, generates random notes and manages guess status. 
// handles what happens when a note is played
// sends messages to VIEW feedback

let model = {
    randomNoteIndexes: [],
    randomNoteIndexesCopy: [],
    numOfRandom: RANDOM_SELECT.value,
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
            } while (this.randomNoteIndexes.includes(randomIndex) == true);
    
            this.randomNoteIndexes.push(randomIndex);
        }  
    
        this.randomNoteIndexesCopy = this.randomNoteIndexes.slice();
    },

    checkGuess: function(note) {
        if (!this.isKey || !this.isGuessing) return false;

        let keyIndex = KEYBOARD.findIndex(function(key) {
            return key.note === note;
        });
    
        // If guess is correct
        if (this.randomNoteIndexes.includes(keyIndex) == true) {
            this.correctCount += 1;
            let removeIndex = this.randomNoteIndexes.indexOf(keyIndex);
            this.randomNoteIndexes.splice(removeIndex, 1);
    
            // If that's the last guess => done
            if (this.correctCount == this.numOfRandom) {
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
        else if (this.randomNoteIndexesCopy.includes(keyIndex) == true) {
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

let controller = {

}

//=====================================================================
// EVENT HANDLERS
// detects user input to send over to CONTROLLER

const COMPUTER_KEYS = [
    "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", 
    "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i"
];

// Mouse Input Detection
KEYS.forEach(key => {
    key.addEventListener("pointerdown", () => {

        // Translate note ID to audio ID and pass into callback
        let note = key.id.slice(0, -4);
        model.isKey = true;
        view.playPiano(note)
    })
})

// Computer Keyboard Input Detection
document.addEventListener("keydown", e => {

    // Safety check: don't repeat note if key is still pressed
    if (e.repeat) return;

    // Get the key pressed from the computer keyboard
    const computerKey = e.key;
    const computerKeyIndex = COMPUTER_KEYS.indexOf(computerKey);

    // Get the note from the piano list of objects
    try {
        note = KEYBOARD[computerKeyIndex].note;
        view.playPiano(note);
    }
    catch(err) {
    }
})

REFERENCE_PLAY.addEventListener("click", () => {

    let referenceIndex = REFERENCE_SELECT.value;
    view.playPiano(KEYBOARD[referenceIndex].note);
    model.isKey = false;
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
        let keyRandom = KEYBOARD[model.randomNoteIndexesCopy[i]].note;
        view.playSound(keyRandom);
    }
}

RANDOM_SELECT.addEventListener("change", () => {

    model.numOfRandom = RANDOM_SELECT.value;
    model.shuffleRandomNotesArray();
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
        let keyRandom = KEYBOARD[model.randomNoteIndexesCopy[i]].note;
        view.playSound(keyRandom);
        view.changeColor(keyRandom);

        answers.push (KEYBOARD[model.randomNoteIndexesCopy[i]].note);
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