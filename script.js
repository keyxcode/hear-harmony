// GLOBAL VARS:
const REFERENCE_PLAY = document.querySelector("#reference");
const REFERENCE_SELECT = document.querySelector("#reference-note");

const RANDOM_PLAY = document.querySelector("#random");
const RANDOM_SELECT = document.querySelector("#num-of-random");

const SHUFFLE = document.querySelector("#shuffle");
const ANSWER = document.querySelector("#answer");

const SHARP_SWITCH = document.querySelector("#sharp-switch");
const STATIC_REF_SWITCH = document.querySelector("#static-ref-switch");

// 4 arrays below are correlated by indexes
// Keyboard notes model array
const PIANO_KEYS = [ 
    {note: "C3", noteSharp: "C3", computerKey: "z"},
    {note: "Db3", noteSharp: "C#3", computerKey: "s"},
    {note: "D3", noteSharp: "D3", computerKey: "x"},
    {note: "Eb3", noteSharp: "D#3", computerKey: "d"},
    {note: "E3", noteSharp: "E3", computerKey: "c"},
    {note: "F3", noteSharp: "F3", computerKey: "v"},
    {note: "Gb3", noteSharp: "F#3", computerKey: "g"},
    {note: "G3", noteSharp: "G3", computerKey: "b"},
    {note: "Ab3", noteSharp: "G#3", computerKey: "h"},
    {note: "A3", noteSharp: "A3", computerKey: "n"},
    {note: "Bb3", noteSharp: "A#3", computerKey: "j"},
    {note: "B3", noteSharp: "B3", computerKey: "m"},

    {note: "C4", noteSharp: "C3", computerKey: "q"},
    {note: "Db4", noteSharp: "C#3", computerKey: "2"},
    {note: "D4", noteSharp: "D3", computerKey: "w"},
    {note: "Eb4", noteSharp: "D#3", computerKey: "3"},
    {note: "E4", noteSharp: "E3", computerKey: "e"},
    {note: "F4", noteSharp: "F3", computerKey: "r"},
    {note: "Gb4", noteSharp: "F#3", computerKey: "5"},
    {note: "G4", noteSharp: "G3", computerKey: "t"},
    {note: "Ab4", noteSharp: "G#3", computerKey: "6"},
    {note: "A4", noteSharp: "A3", computerKey: "y"},
    {note: "Bb4", noteSharp: "A#3", computerKey: "7"},
    {note: "B4", noteSharp: "B3", computerKey: "u"},
    {note: "C5", noteSharp: "C3", computerKey: "i"}
];

// Arrays of keys on screen (aka key divs)
const KEY_DIVS = document.querySelectorAll(".key");
const NUM_OF_KEYS = KEY_DIVS.length;

// Array of HTML audios
const KEY_AUDIOS = document.querySelectorAll("audio");

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

    initFeedback: function() {
        this.feedbackMessage1("First, \"Play reference.\"");
        this.feedbackMessage2 ("Then, \"Play random\" and select what you hear on the keyboard.");
    },

    // ideally conversion from string "A3" -> num 
    // should take place elsewhere
    playPiano: function(id) {
        this.playNoteSound(id);
        this.changeNoteColor(id);
    },

    playNoteSound: function(id) {
        let noteAudio = KEY_AUDIOS[id];
        noteAudio.currentTime = 0;
        noteAudio.play();
    },

    changeNoteColor: function(id) {
        let key = KEY_DIVS[id];
        key.classList.add("active");
    },

    // Pause everything
    stopAudioVisual: function() {
        document.querySelectorAll("audio").forEach(el => el.pause());
        document.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
    },

    initKeyNames: function() {
        for (let [i, key] of KEY_DIVS.entries()) {
            if (model.isPreferSharps) {
                key.innerHTML = PIANO_KEYS[i].noteSharp
            } else {
                key.innerHTML = PIANO_KEYS[i].note;
            }
        }
    },
    
    // Initialize all options for reference note
    initReference: function() {
        for (let [i, key] of PIANO_KEYS.entries()) {
            let option = document.createElement("option");
            option.text = key.note,
            option.value = i;
            REFERENCE_SELECT.add(option);
        }
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
    isGuessing: false,
    isPreferSharps: false,
    isStaticRef: false,

    switchSharpFlat: function() {
        this.isPreferSharps = (this.isPreferSharps === true) ? false : true;
        view.initKeyNames();
    },

    switchRefState: function() {
        this.isStaticRef = (this.isStaticRef === true) ? false : true;
    },

    shuffleAll: function () {
        if (!this.isStaticRef) this.shuffleReference();
        this.shuffleRandomNotesArray();
        view.initFeedback();
    },

    shuffleReference: function() {
        REFERENCE_SELECT.value = Math.floor(Math.random() * NUM_OF_KEYS);
    },
    
    // Generate n random indexes within the range of number of notes
    shuffleRandomNotesArray: function() {
    
        this.randomNoteIndexes = [];
        let randomIndex;
    
        // Randomize and assure unique numbers
        for (let i = 0; i < this.numOfRandom; ++i) {
            do {
                randomIndex = Math.floor(Math.random() * NUM_OF_KEYS);
            } while (this.randomNoteIndexes.includes(randomIndex) === true);
    
            this.randomNoteIndexes.push(randomIndex);
        }  
    
        this.randomNoteIndexesCopy = this.randomNoteIndexes.slice();
    },

    // refactor this to take in number instead
    checkGuess: function(id) {
        if (!this.isGuessing) return false;
    
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
    processPianoNote(id) {
        model.checkGuess(id);
        view.playPiano(id);
    },

    parsePianoMouseInput: function(e) {
        // Get the note id from the key div id
        let id = (Array.from(KEY_DIVS)).indexOf(e.target);

        this.processPianoNote(id);
    },

    parsePianoKeyInput: function(e) {
        // Safety check: don't repeat note if key is still pressed
        if (e.repeat) return;

        // Get the note id from the computer key id
        const computerKey = e.key;
        let id = COMPUTER_KEYS.indexOf(computerKey);
        if (id === -1) return false;

        this.processPianoNote(id);
    },

    playReference: function() {
        let id = REFERENCE_SELECT.value;
        view.playPiano(id);
    },

    playRandom: function() {
        // Play all the random notes in the array
        for (let i = 0; i < model.numOfRandom; ++i)
        {
            let id = model.randomNoteIndexesCopy[i];
            view.playNoteSound(id);
        }
        model.isGuessing = true;    
    },

    selectNumRandom: function() {
        model.numOfRandom = parseInt(RANDOM_SELECT.value);
        // shuffle the random array everytime the number of random notes is changed
        model.shuffleRandomNotesArray(); 
    },

    showAnswer: function() {
        let answers = [];
        model.randomNoteIndexesCopy.sort((a,b) => a - b);

        // Play all the random notes in the array
        for (let i = 0; i < model.numOfRandom; ++i)
        {
            let id = model.randomNoteIndexesCopy[i];
            // Play each note in the sorted random array, 
            view.playNoteSound(id);
            view.changeNoteColor(id);
            // and push each of those in the answers array
            answers.push (PIANO_KEYS[id].note);
        }
    
        model.correctCount = 0;
        model.isGuessing = false;
    
        view.feedbackMessage1(answers);
        view.feedbackMessage2("Keep trying!");
    }
}

//=====================================================================
// EVENT HANDLERS
// detects user input to send over to CONTROLLER

// Piano Mouse Input handler
KEY_DIVS.forEach(key => {
    key.addEventListener("pointerdown", e => controller.parsePianoMouseInput(e))
});
document.addEventListener("pointerup", () => view.stopAudioVisual());

// Piano Computer Keyboard Input handlers
document.addEventListener("keydown", e => controller.parsePianoKeyInput(e));
document.addEventListener("keyup", () => view.stopAudioVisual());

// Utility buttons handlers
REFERENCE_PLAY.addEventListener("click", () => controller.playReference());
RANDOM_PLAY.addEventListener("click", () => controller.playRandom());
RANDOM_SELECT.addEventListener("change", () => controller.selectNumRandom());
SHUFFLE.addEventListener("click", () => model.shuffleAll());
ANSWER.addEventListener("click", () => controller.showAnswer());

// Toggle Switches
SHARP_SWITCH.addEventListener("click", () => model.switchSharpFlat());
STATIC_REF_SWITCH.addEventListener("click", () => model.switchRefState());

//=====================================================================
// INIT
// initializes page on load

window.addEventListener("load", initGame);
function initGame() {
    view.initKeyNames();
    view.initFeedback();
    view.initReference();

    model.shuffleReference();
    model.shuffleRandomNotesArray();
}