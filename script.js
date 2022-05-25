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

// LOCAL STORAGE VARS
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

// Arrays of key divs on screen to look up touch input
const KEY_DIVS = document.querySelectorAll(".key");

// Array of computer keys to look up key input
const COMPUTER_KEYS = [
    "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", 
    "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i"
];

//=====================================================================
// MODEL: the backend, generates random notes, plays notes and manages guess status. 
// Processes note as number indexes (0 -> 25)
// handles what happens when a note is played
// sends messages to VIEW feedback

let model = {
    // game states for reference
    // gameState: {0: "init", 1: "won", 2: "correct", 3: "incorrect", 4: "duplicated"},

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

    shuffleAll: function () {
        if (!JSON.parse(model.isStaticRef)) this.shuffleReference();
        this.shuffleRandomNotesArray();
        this.correctCount = 0;
        controller.gameStateChanged(0); // init
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
    
        this.randomNoteIndexesCopy = this.randomNoteIndexes.slice().sort((a,b) => a - b);
    },

    playNoteSound: function(id) {
        let voiceID = this.activeVoiceID;
        this.pianoVoices[voiceID].node = CTX.createBufferSource();
        this.pianoVoices[voiceID].node.buffer = this.fetchedSamples[id];
        this.pianoVoices[voiceID].gainFader.gain.value = 1;
        this.pianoVoices[voiceID].node.connect(this.pianoVoices[voiceID].gainFader);
        this.pianoVoices[voiceID].node.start(CTX.currentTime);
        this.pianoVoices[voiceID].isActive = true;

        this.activeVoiceID = (this.activeVoiceID + 1) % this.numPianoVoices;
    },

    stopPianoSound: function() {
        for (let i = 0; i < this.numPianoVoices; i++) {
            if (this.pianoVoices[i].isActive === true) {
                currentTime = CTX.currentTime;
                this.pianoVoices[i].gainFader.gain.setValueAtTime(1, currentTime);
                this.pianoVoices[i].gainFader.gain.exponentialRampToValueAtTime(0.0001, currentTime + 1);
                //this.pianoVoices[i].node.stop();
                this.pianoVoices[i].isActive = false;
            }
        }
    },

    // refactor this to take in number instead
    checkGuess: function(id) {
        // If guess is correct
        if (this.randomNoteIndexes.includes(id) === true) {
            this.correctCount += 1;
            let removeIndex = this.randomNoteIndexes.indexOf(id);
            this.randomNoteIndexes.splice(removeIndex, 1);
    
            // If that's the last guess => done
            if (this.correctCount === this.numOfRandom) {
                this.correctCount = 0;
                this.isGuessing = false;
                controller.gameStateChanged(1); // won
            }
            // Else, tell how many more guesses to go
            else {
                let notesLeft = this.numOfRandom - this.correctCount;
                controller.gameStateChanged(2, notesLeft); // correct
            } 
        } 
    
        // If guess is correct, but duplicated
        else if (this.randomNoteIndexesCopy.includes(id) === true) {
            controller.gameStateChanged(4); // duplicated
        } 
        
        // If guess is not correct
        else {
            controller.gameStateChanged(3); // incorrect
        }
    },

    updateNoteState: function() {
        let noteState;
        if (JSON.parse(this.isPreferSharp) === false) {
            this.isPreferSharp = true;
            noteState = "noteSharp";
        } else if (JSON.parse(this.isPreferSharp) === true) {
            this.isPreferSharp = false;
            noteState = "note";
        }
        localStorage.setItem("isPreferSharp", this.isPreferSharp);
        controller.noteStateChanged(noteState);
    },

    updateRefState: function() {
        this.isStaticRef = (JSON.parse(this.isStaticRef) === true) ? false : true;
        localStorage.setItem("isStaticRef", this.isStaticRef);
    },
}

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

    changeNoteColor: function(id) {
        let key = KEY_DIVS[id];
        key.classList.add("active");
    },

    initKeyNames: function(noteState) {
        for (let [i, key] of KEY_DIVS.entries()) {
                key.innerHTML = PIANO_KEYS[i][noteState];
        }
    },
    
    initReferenceList: function(noteState) {
        // Init the options
        let referenceNotes = Array.from(document.querySelectorAll("#referenceNote"));
        if (referenceNotes.length === 0) {
            for (let i = 0; i < NUM_OF_KEYS; ++i) {
                let option = document.createElement("option");
                option.value = i;
                option.id = "referenceNote"
                referenceNotes.push(option);
                REFERENCE_SELECT.add(option);
            }
        }
        
        // Name them. Separated to support sharp-flat toggle
        for (let [i, option] of referenceNotes.entries()) {
            option.text = PIANO_KEYS[i][noteState];
        }
    },

    updateSharpFlat: function(noteState) {
        this.initKeyNames(noteState);
        this.initReferenceList(noteState);
    }
}

//=====================================================================
// EVENT HANDLERS
// detects user input to send over to CONTROLLER

// Piano Mouse Input handler
KEY_DIVS.forEach(key => {
    key.addEventListener("pointerdown", e => controller.parsePianoMouseInput(e));
});
document.addEventListener("pointerup", () => controller.stopAudioVisual());

// Piano Computer Keyboard Input handlers
document.addEventListener("keydown", e => controller.parsePianoKeyInput(e));
document.addEventListener("keyup", () => controller.stopAudioVisual());

// Utility buttons handlers
REFERENCE_PLAY.addEventListener("click", () => controller.playReference());
RANDOM_PLAY.addEventListener("click", () => controller.playRandom());
RANDOM_SELECT.addEventListener("change", () => controller.selectNumRandom());
SHUFFLE.addEventListener("click", () => model.shuffleAll());
ANSWER.addEventListener("click", () => controller.showAnswer());

// Toggle Switches
SHARP_SWITCH.addEventListener("click", () => model.updateNoteState());
STATIC_REF_SWITCH.addEventListener("click", () => model.updateRefState());

//=====================================================================
// CONTROLLER: lets user interact with the MODEL by guessing
// sends messages to VIEW
// Process key and mouse input and turn them into integers 0->27

let controller = {
    parsePianoMouseInput: function(e) {
        // Get the note id from the key div id
        let id = (Array.from(KEY_DIVS)).indexOf(e.target);
        this.processNote(id);
    },

    parsePianoKeyInput: function(e) {
        // Safety check: don't repeat note if key is still pressed
        if (e.repeat) return;

        // Get the note id from the computer key id
        const computerKey = e.key;
        let id = COMPUTER_KEYS.indexOf(computerKey);
        if (id === -1) return false;

        this.processNote(id);
    },

    processNote(id) {
        this.playPiano(id);
        if (model.isGuessing) model.checkGuess(id);
    },

    playPiano: function(id) {
        model.playNoteSound(id);
        view.changeNoteColor(id);
    },

    stopAudioVisual: function() {
        document.querySelectorAll(".active").forEach(el => el.classList.remove("active"));
        model.stopPianoSound();
    },

    playReference: function() {
        let id = parseInt(REFERENCE_SELECT.value);
        this.playPiano(id);
    },

    playRandom: function() {
        // Play all the random notes in the array
        for (let i = 0; i < model.numOfRandom; ++i)
        {
            let id = model.randomNoteIndexesCopy[i];
            model.playNoteSound(id);
        }
        
        // Once the user hits play, game starts
        model.isGuessing = true;    
    },

    selectNumRandom: function() {
        // Write the new num of random to local storage and update model
        localStorage.setItem("numOfRandom", RANDOM_SELECT.value);
        model.numOfRandom = parseInt(localStorage.getItem("numOfRandom"));

        // shuffle the random array everytime the number of random notes is changed
        model.shuffleRandomNotesArray(); 
    },

    processRandomIndexes: function(randomNoteIndexesCopy) {
        // Determine note state based on sharp/ flat preference
        let noteState = (JSON.parse(model.isPreferSharp) === true) ? "noteSharp" : "note";
        let answerArray = model.randomNoteIndexesCopy.map(id => { 
            return PIANO_KEYS[id][noteState] 
        });

        // Format the answer string
        let answerString = "";
        let lastIndex = model.numOfRandom - 1;
        for (let i in answerArray) {
            answerString += answerArray[i];
            if (i < lastIndex) answerString += " - ";
        }
        return answerString;
    },

    showAnswer: function() {
        // Play all the random notes in the array
        model.randomNoteIndexesCopy.forEach((id) => this.playPiano(id));
    
        model.correctCount = 0;
        model.isGuessing = false;

        let answerString = this.processRandomIndexes(model.randomNoteIndexesCopy);
        view.feedbackMessage1(answerString);
        view.feedbackMessage2("Keep trying!");
    },

    gameStateChanged: function(gameState, notesLeft) {
        switch (gameState) {
            case 0: // init
                view.initFeedback();
                break;
            case 1: // won
                view.feedbackMessage1("Great job! 🏆");
                view.feedbackMessage2("Click \"Shuffle\" to get a new challenge.");
                break;
            case 2: // correct
                view.feedbackMessage1("Correct!");
                view.feedbackMessage2((notesLeft) + " more to go.");
                break;
            case 3: // incorrect
                view.feedbackMessage1("Incorrect!");
                view.feedbackMessage2("Let's try again.");
                break;
            case 4: // duplicated
                view.feedbackMessage1("Correct!");
                view.feedbackMessage2("But you've already guessed it.");
                break;
            default:
                view.feedbackMessage1("Something is wrong 😿");
                view.feedbackMessage2("Please reload the page.");
        }
    },

    noteStateChanged: function(noteState) {
        view.updateSharpFlat(noteState);
    }
}

//=====================================================================
// INIT

window.addEventListener("load", initGame);
function initGame() {
    // Fetch piano samples
    for (let i = 0; i < NUM_OF_KEYS; i++) {
        let noteName = PIANO_KEYS[i].note;
        fetch(`Weber Baby Grand keyxcode/${noteName}.mp3`)
        .then(data => data.arrayBuffer())
        .then(arrayBuffer => CTX.decodeAudioData(arrayBuffer))
        .then(decodedAudio => {
            let audio = decodedAudio;
            model.fetchedSamples[i] = audio;
        })  
    }

    // Init the voice manager/ mixer in model
    for (let i = 0; i < model.numPianoVoices; i ++) {
        let gainFader = CTX.createGain();
        gainFader.connect(MASTER_GAIN);
        model.pianoVoices.push({voiceID: `${i}`, isActive: false, node: null, gainFader: gainFader});
    }

    // Init GUI
    SHARP_SWITCH.checked = JSON.parse(model.isPreferSharp);
    STATIC_REF_SWITCH.checked = JSON.parse(model.isStaticRef);
    RANDOM_SELECT.value = parseInt(localStorage.getItem("numOfRandom"));

    let noteState = (JSON.parse(model.isPreferSharp) === true) ? "noteSharp" : "note"; 
    view.initKeyNames(noteState);
    view.initReferenceList(noteState);

    view.initFeedback();

    // Can only call this after initReference above
    model.shuffleAll();
}