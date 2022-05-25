// GLOBAL VARS:
const REFERENCE_PLAY = document.querySelector("#reference");
const REFERENCE_SELECT = document.querySelector("#reference-select");

const RANDOM_PLAY = document.querySelector("#random");
const RANDOM_SELECT = document.querySelector("#num-of-random");

const SHUFFLE = document.querySelector("#shuffle");
const ANSWER = document.querySelector("#answer");

const SHARP_SWITCH = document.querySelector("#sharp-switch");
const STATIC_REF_SWITCH = document.querySelector("#static-ref-switch");

const CTX = new (window.AudioContext || window.webkitAudioContext)();
const MASTER_GAIN = CTX.createGain();
MASTER_GAIN.gain.value = 0.7;
MASTER_GAIN.connect(CTX.destination);

if (!localStorage.getItem("isPreferSharp")) {
    localStorage.setItem("isPreferSharp", false);
}
if (!localStorage.getItem("isStaticRef")) {
    localStorage.setItem("isStaticRef", false);
}
if (!localStorage.getItem("numOfRandom")) {
    localStorage.setItem("numOfRandom", 1);
}


// The arrays below are correlated by indexes
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

    {note: "C4", noteSharp: "C4", computerKey: "q"},
    {note: "Db4", noteSharp: "C#4", computerKey: "2"},
    {note: "D4", noteSharp: "D4", computerKey: "w"},
    {note: "Eb4", noteSharp: "D#4", computerKey: "3"},
    {note: "E4", noteSharp: "E4", computerKey: "e"},
    {note: "F4", noteSharp: "F4", computerKey: "r"},
    {note: "Gb4", noteSharp: "F#4", computerKey: "5"},
    {note: "G4", noteSharp: "G4", computerKey: "t"},
    {note: "Ab4", noteSharp: "G#4", computerKey: "6"},
    {note: "A4", noteSharp: "A4", computerKey: "y"},
    {note: "Bb4", noteSharp: "A#4", computerKey: "7"},
    {note: "B4", noteSharp: "B4", computerKey: "u"},
    {note: "C5", noteSharp: "C5", computerKey: "i"}
];
const NUM_OF_KEYS = PIANO_KEYS.length;

// Arrays of keys on screen (aka key divs)
const KEY_DIVS = document.querySelectorAll(".key");

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
        this.feedbackMessage1("First, listen to the \"Reference.\"");
        this.feedbackMessage2 ("Then, \"Play\" and press the note(s) you hear.");
    },

    // ideally conversion from string "A3" -> num 
    // should take place elsewhere
    playPiano: function(id) {
        this.playNoteSound(id);
        this.changeNoteColor(id);
    },

    playNoteSound: function(id) {
        let voiceID = model.activeVoiceID;
        model.pianoVoices[voiceID].node = CTX.createBufferSource();
        model.pianoVoices[voiceID].node.buffer = model.fetchedSamples[id];
        model.pianoVoices[voiceID].gainFader.gain.value = 1;
        model.pianoVoices[voiceID].node.connect(model.pianoVoices[voiceID].gainFader);
        model.pianoVoices[voiceID].node.start(CTX.currentTime);
        model.pianoVoices[voiceID].isActive = true;

        model.activeVoiceID = (model.activeVoiceID + 1) % model.numPianoVoices;
    },

    changeNoteColor: function(id) {
        let key = KEY_DIVS[id];
        key.classList.add("active");
    },

    // Pause everything
    stopAudioVisual: function() {
        document.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
        this.stopPianoSound();
    },

    stopPianoSound: function() {
        for (let i = 0; i < model.numPianoVoices; i++) {
            if (model.pianoVoices[i].isActive === true) {
                currentTime = CTX.currentTime;
                model.pianoVoices[i].gainFader.gain.setValueAtTime(1, currentTime);
                model.pianoVoices[i].gainFader.gain.exponentialRampToValueAtTime(0.0001, currentTime + 1);
                //model.pianoVoices[i].node.stop();
                model.pianoVoices[i].isActive = false;
            }
        }
    },

    initKeyNames: function(noteState) {
        for (let [i, key] of KEY_DIVS.entries()) {
                key.innerHTML = PIANO_KEYS[i][noteState];
        }
    },
    
    // Initialize all options for reference note
    initReference: function(noteState) {
        for (let [i, key] of PIANO_KEYS.entries()) {
            let option = document.createElement("option");
            option.text = key[noteState];
            option.value = i;
            option.id = "referenceNote"

            REFERENCE_SELECT.add(option);
        }
    },

    updateSharpFlat: function(noteState) {
        for (let [i, key] of KEY_DIVS.entries()) {
            key.innerHTML = PIANO_KEYS[i][noteState];
        }

        let referenceNotes = document.querySelectorAll("#referenceNote");
        for (let [i, ref] of referenceNotes.entries()) {
            ref.text = PIANO_KEYS[i][noteState];
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
    fetchedSamples: [],
    pianoVoices: [],
    numPianoVoices: 48,
    activeVoiceID: 0,
    numOfRandom: parseInt(localStorage.getItem("numOfRandom")),
    correctCount: 0,
    isGuessing: false,
    isPreferSharp: localStorage.getItem("isPreferSharp"),
    isStaticRef: localStorage.getItem("isStaticRef"),

    switchSharpFlat: function() {
        let noteState;
        if (JSON.parse(this.isPreferSharp) === false) {
            this.isPreferSharp = true;
            noteState = "noteSharp";
        } else if (JSON.parse(this.isPreferSharp) === true) {
            this.isPreferSharp = false;
            noteState = "note";
        }
        localStorage.setItem("isPreferSharp", this.isPreferSharp);
        view.updateSharpFlat(noteState);
    },

    switchRefState: function() {
        this.isStaticRef = (JSON.parse(this.isStaticRef) === true) ? false : true;
        localStorage.setItem("isStaticRef", this.isStaticRef);
    },

    shuffleAll: function () {
        if (!JSON.parse(model.isStaticRef)) this.shuffleReference();
        this.shuffleRandomNotesArray();
        view.initFeedback();
        this.correctCount = 0;
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
                view.feedbackMessage1("Great job! 🏆");
                view.feedbackMessage2("Click \"Shuffle\" to get a new challenge.");
                this.correctCount = 0;
                this.isGuessing = false;
            }
            // Else, tell how many more guesses to go
            else {
                view.feedbackMessage1("Correct!");
                view.feedbackMessage2((this.numOfRandom - this.correctCount) + " more to go.");
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
    parsePianoMouseInput: function(e) {
        // Get the note id from the key div id
        let id = (Array.from(KEY_DIVS)).indexOf(e.target);
        this.processActiveNote(id);
    },

    processActiveNote(id) {
        model.checkGuess(id);
        view.playPiano(id);
    },

    parsePianoKeyInput: function(e) {
        // Safety check: don't repeat note if key is still pressed
        if (e.repeat) return;

        // Get the note id from the computer key id
        const computerKey = e.key;
        let id = COMPUTER_KEYS.indexOf(computerKey);
        if (id === -1) return false;

        this.processActiveNote(id);
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
        localStorage.setItem("numOfRandom", RANDOM_SELECT.value);
        model.numOfRandom = parseInt(localStorage.getItem("numOfRandom"));
        // shuffle the random array everytime the number of random notes is changed
        model.shuffleRandomNotesArray(); 
    },

    answers: [],
    showAnswer: function() {
        this.answers = [];
        model.randomNoteIndexesCopy.sort((a,b) => a - b);

        let noteState = (JSON.parse(model.isPreferSharp) === true) ? "noteSharp" : "note";
        // Play all the random notes in the array
        for (let i = 0; i < model.numOfRandom; ++i)
        {
            let id = model.randomNoteIndexesCopy[i];
            // Play each note in the sorted random array, 
            view.playNoteSound(id);
            view.changeNoteColor(id);
            // and push each of those in the answers array
            this.answers.push (PIANO_KEYS[id][noteState]);
        }
    
        model.correctCount = 0;
        model.isGuessing = false;
    
        view.feedbackMessage1(this.answers);
        view.feedbackMessage2("Keep trying!");
    }
}

//=====================================================================
// EVENT HANDLERS
// detects user input to send over to CONTROLLER

// Piano Mouse Input handler
KEY_DIVS.forEach(key => {
    key.addEventListener("pointerdown", e => controller.parsePianoMouseInput(e));
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
    // Init piano samples
    for (let i = 0; i < NUM_OF_KEYS; i++) {
        let noteName = PIANO_KEYS[i].note;
        let audio;
        fetch(`Weber Baby Grand keyxcode/${noteName}.mp3`)
        .then(data => data.arrayBuffer())
        .then(arrayBuffer => CTX.decodeAudioData(arrayBuffer))
        .then(decodedAudio => {
            audio = decodedAudio;
            model.fetchedSamples[i] = audio;
        })  
    }

    // Init voice manager
    for (let i = 0; i < model.numPianoVoices; i ++) {
        let gainFader = CTX.createGain();
        gainFader.connect(MASTER_GAIN);
        model.pianoVoices.push({voiceID: `${i}`, isActive: false, node: null, gainFader: gainFader});
    }

    // Init sharp flat switch
    SHARP_SWITCH.checked = JSON.parse(model.isPreferSharp);

    // Init static reference switch
    STATIC_REF_SWITCH.checked = JSON.parse(model.isStaticRef);

    // Init number of random notes
    RANDOM_SELECT.value = parseInt(localStorage.getItem("numOfRandom"));

    let noteState = (JSON.parse(model.isPreferSharp) === true) ? "noteSharp" : "note"; 
    view.initKeyNames(noteState);
    view.initFeedback();
    view.initReference(noteState);

    model.shuffleReference();
    model.shuffleRandomNotesArray();
}