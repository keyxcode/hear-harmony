// GLOBAL VARS (HTML BUTTONS & UTILS)
const REFERENCE_PLAY = document.querySelector("#reference");
const REFERENCE_SELECT = document.querySelector("#reference-select");
const RANDOM_PLAY = document.querySelector("#random");
const RANDOM_SELECT = document.querySelector("#num-of-random");
const SHUFFLE = document.querySelector("#shuffle");
const ANSWER = document.querySelector("#answer");
const SHARP_SWITCH = document.querySelector("#sharp-switch");
const STATIC_REF_SWITCH = document.querySelector("#static-ref-switch");
const DARK_SWITCH = document.querySelector("#dark-switch");

// AUDIO CONTEXT
const CTX = new (window.AudioContext || window.webkitAudioContext)();
const MASTER_GAIN = CTX.createGain();
MASTER_GAIN.gain.value = 0.7;
MASTER_GAIN.connect(CTX.destination);

// LOCAL STORAGE VARS
if (!localStorage.getItem("referenceNoteID")) {
    localStorage.setItem("referenceNoteID", 12);
}
if (!localStorage.getItem("isPreferSharp")) {
    localStorage.setItem("isPreferSharp", false);
}
if (!localStorage.getItem("isStaticRef")) {
    localStorage.setItem("isStaticRef", false);
}
if (!localStorage.getItem("numOfRandom")) {
    localStorage.setItem("numOfRandom", 1);
}
if (!localStorage.getItem("isDarkMode")) {
    localStorage.setItem("isDarkMode", false);
}

// LOOK-UP ARRAYS
// Arrays of key divs on screen to look up touch input
const KEY_DIVS = document.querySelectorAll(".key");
// Array of computer keys to look up key input
const COMPUTER_KEYS = [
    "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", 
    "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i"
];

//=====================================================================
// MODEL: the backend, generates random notes, plays samples and manages game state. 
// Processes notes as number indexes (0 -> NUM_OF_KEYS)
// handles what happens when a note is played
// communicates with CONTROLLER

let model = {
    // game states for reference
    // gameState: {0: "init", 1: "won", 2: "correct", 3: "incorrect", 4: "duplicated"},

    // The piano model will be initialized on load
    PIANO_KEYS: [],
    NUM_OF_KEYS: 0,

    randomNoteIndexes: [],
    randomNoteIndexesCopy: [],

    fetchedSamples: [],
    pianoVoices: [],
    numPianoVoices: 48,
    activeVoiceID: 0,

    numOfRandom: parseInt(localStorage.getItem("numOfRandom")),
    correctCount: 0,
    isGuessing: false,

    referenceNoteID: localStorage.getItem("referenceNoteID"),
    isPreferSharp: localStorage.getItem("isPreferSharp"),
    isStaticRef: localStorage.getItem("isStaticRef"),
    isDarkMode: localStorage.getItem("isDarkMode"),

    shuffleReference: function() {
        let referenceNoteID = Math.floor(Math.random() * model.NUM_OF_KEYS);
        controller.updateRefID(referenceNoteID);
    },
    
    // Generate n random indexes within the range of number of notes
    shuffleRandomNotesArray: function() {
        this.randomNoteIndexes = [];
        let randomIndex;
    
        // Randomize and assure unique numbers
        for (let i = 0; i < this.numOfRandom; ++i) {
            do {
                randomIndex = Math.floor(Math.random() * model.NUM_OF_KEYS);
            } while (this.randomNoteIndexes.includes(randomIndex) === true);
    
            this.randomNoteIndexes.push(randomIndex);
        }  
    
        // Save and sort this random array into a copy for later use
        this.randomNoteIndexesCopy = this.randomNoteIndexes.slice().sort((a,b) => a - b);
    },

    playNoteSound: function(id) {
        let voiceID = this.activeVoiceID;
        let pianoVoices = this.pianoVoices;

        // Load sample into the voice slot
        pianoVoices[voiceID].node = CTX.createBufferSource();
        pianoVoices[voiceID].node.buffer = this.fetchedSamples[id];
        // Initialize gain fader
        pianoVoices[voiceID].gainFader.gain.value = 1;
        pianoVoices[voiceID].node.connect(this.pianoVoices[voiceID].gainFader);
        // Play note and set active
        pianoVoices[voiceID].node.start(CTX.currentTime);
        pianoVoices[voiceID].isActive = true;
        // Get the next active voice ID to stream the next sample
        this.activeVoiceID = (this.activeVoiceID + 1) % this.numPianoVoices;
    },

    stopPianoSound: function() {
        this.pianoVoices.forEach(voice => {
            if (voice.isActive == true) {
                // Fade out
                currentTime = CTX.currentTime;
                voice.gainFader.gain.setValueAtTime(1, currentTime);
                voice.gainFader.gain.exponentialRampToValueAtTime(0.001, currentTime + 1);
                // voice.stop();
                voice.isActive = false;
            }
        });
    },

    // refactor this to take in number instead
    checkGuess: function(id) {
        // If guess is found in the original random array
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
    
        // If guess is not found in the original spliced array, 
        // but is found in the copied array, it is duplicated
        else if (this.randomNoteIndexesCopy.includes(id) === true) {
            controller.gameStateChanged(4); // duplicated
        } 
        
        // If guess is not found anywhere
        else {
            controller.gameStateChanged(3); // incorrect
        }
    },
}

//=====================================================================
//VIEW: alters the UI based on given inputs from CONTROLLER
// feedback message, key colors, key names, key states (sharp flat), init options
// does read-only operation on model

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
                key.innerHTML = model.PIANO_KEYS[i][noteState];
        }
    },
    
    initReferenceList: function(noteState) {
        // Init the options
        let referenceNotes = Array.from(document.querySelectorAll("#referenceNote"));
        if (referenceNotes.length === 0) {
            for (let i = 0; i < model.NUM_OF_KEYS; ++i) {
                let option = document.createElement("option");
                option.value = i;
                option.id = "referenceNote"
                referenceNotes.push(option);
                REFERENCE_SELECT.add(option);
            }
        }
        
        // Name them. Separated to support sharp-flat toggle
        for (let [i, option] of referenceNotes.entries()) {
            option.text = model.PIANO_KEYS[i][noteState];
        }
    },

    updateSharpFlat: function(noteState) {
        this.initKeyNames(noteState);
        this.initReferenceList(noteState);
    },

    updateDarkMode: function(isDarkMode) {
        let body = document.querySelector("body");
        let navBarAndFooter = document.querySelectorAll(".navbar, footer");
        let navBarAndFooterText = document.querySelectorAll(".navbar-brand, footer div, footer a");
        let toggleText = document.querySelector(".toggles");

        let bgColor = getComputedStyle(document.documentElement).getPropertyValue("--bg-color");
        let whiteKeyColor = getComputedStyle(document.documentElement).getPropertyValue("--white-key-color");
        let whiteKeyActiveColor = getComputedStyle(document.documentElement).getPropertyValue("--white-key-active-color");
        let blackKeyColor = getComputedStyle(document.documentElement).getPropertyValue("--black-key-color");
        let blackKeyActiveColor = getComputedStyle(document.documentElement).getPropertyValue("--black-key-active-color");

        if (isDarkMode === true) {
            body.style.backgroundColor = blackKeyColor;
            navBarAndFooter.forEach(el => el.style.backgroundColor = blackKeyActiveColor);
            navBarAndFooterText.forEach(el => el.style.color = whiteKeyActiveColor);
            toggleText.style.color = whiteKeyColor;

        } else {
            body.style.backgroundColor = bgColor;
            navBarAndFooter.forEach(el => el.style.backgroundColor = blackKeyColor);
            navBarAndFooterText.forEach(el => el.style.color = whiteKeyColor);
            toggleText.style.color = blackKeyColor;
        }

        this.updateResponsiveComponents();
    },

    mediaQuery: window.matchMedia("(max-width: 768px)"),
    updateResponsiveComponents() {
        let whiteKeyColor = getComputedStyle(document.documentElement).getPropertyValue("--white-key-color");
        let whiteKeyActiveColor = getComputedStyle(document.documentElement).getPropertyValue("--white-key-active-color");
        let blackKeyColor = getComputedStyle(document.documentElement).getPropertyValue("--black-key-color");
        let blackKeyActiveColor = getComputedStyle(document.documentElement).getPropertyValue("--black-key-active-color");

        let piano = document.querySelector(".piano");
        let pianoText = document.querySelector("#scroll");
        if (this.mediaQuery.matches && JSON.parse(model.isDarkMode)) {
            piano.style.backgroundColor = blackKeyActiveColor;
            pianoText.style.color = whiteKeyColor;
        } else if (this.mediaQuery.matches && JSON.parse(!model.isDarkMode)) {
            piano.style.backgroundColor = blackKeyColor;
            pianoText.style.color = whiteKeyActiveColor;
        } else {
            piano.style.backgroundColor = null;
            pianoText.style.color = null;
        }

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
REFERENCE_SELECT.addEventListener("change", e => controller.updateRefID(e.target.value));
RANDOM_PLAY.addEventListener("click", () => controller.playRandom());
RANDOM_SELECT.addEventListener("change", () => controller.selectNumRandom());
SHUFFLE.addEventListener("click", () => controller.shuffleAll());
ANSWER.addEventListener("click", () => controller.showAnswer());

// Toggle Switches
SHARP_SWITCH.addEventListener("click", () => controller.updateNoteState());
STATIC_REF_SWITCH.addEventListener("click", () => controller.updateRefState());
DARK_SWITCH.addEventListener("click", () => controller.updateDarkMode());

// Responsive Piano
view.mediaQuery.addEventListener("change", () => view.updateResponsiveComponents());

//=====================================================================
// CONTROLLER: lets user interact with the MODEL by guessing
// sends messages to VIEW calls VIEW methods upon changes
// Process key and mouse input and turn them into integers 0 -> NUM_OF_KEYS

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

    updateRefID: function(referenceNoteID) {
        REFERENCE_SELECT.value = referenceNoteID;
        model.referenceNoteID = referenceNoteID;
        localStorage.setItem("referenceNoteID", referenceNoteID);
    },

    playReference: function() {
        let id = parseInt(REFERENCE_SELECT.value);
        this.playPiano(id);
    },

    playRandom: function() {
        // Play all the random notes in the array
        model.randomNoteIndexesCopy.forEach((id) => model.playNoteSound(id));
        model.isGuessing = true;    
    },

    selectNumRandom: function() {
        // Write the new num of random to local storage and update model
        localStorage.setItem("numOfRandom", RANDOM_SELECT.value);
        model.numOfRandom = parseInt(localStorage.getItem("numOfRandom"));

        // shuffle the random array everytime the number of random notes is changed
        model.shuffleRandomNotesArray(); 
    },

    shuffleAll: function () {
        if (!JSON.parse(model.isStaticRef)) model.shuffleReference()
        else controller.updateRefID(model.referenceNoteID);

        model.shuffleRandomNotesArray();
        model.correctCount = 0;
        this.gameStateChanged(0); // init
        this.isShowingAnswer = false;
    },

    processRandomIndexes: function() {
        // Determine sharp/ flat preference and push notes to an array
        let noteState = (JSON.parse(model.isPreferSharp) === true) ? "noteSharp" : "note";
        let answerArray = model.randomNoteIndexesCopy.map(id => { 
            return model.PIANO_KEYS[id][noteState] 
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

    isShowingAnswer: false,
    showAnswer: function() {
        // Play all the random notes in the array
        model.randomNoteIndexesCopy.forEach((id) => this.playPiano(id));
    
        model.correctCount = 0;
        model.isGuessing = false;

        let answerString = this.processRandomIndexes();
        view.feedbackMessage1(answerString);
        view.feedbackMessage2("Keep trying!");
        this.isShowingAnswer = true;
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

    updateNoteState: function() {
        let noteState;
        if (JSON.parse(model.isPreferSharp) === false) {
            model.isPreferSharp = true;
            noteState = "noteSharp";
        } else if (JSON.parse(model.isPreferSharp) === true) {
            model.isPreferSharp = false;
            noteState = "note";
        }
        localStorage.setItem("isPreferSharp", model.isPreferSharp);
        
        view.updateSharpFlat(noteState);
        if (JSON.parse(this.isShowingAnswer) === true) this.showAnswer();
    },

    updateRefState: function() {
        model.isStaticRef = (JSON.parse(model.isStaticRef) === true) ? false : true;
        localStorage.setItem("isStaticRef", model.isStaticRef);
    },

    updateDarkMode: function() {
        model.isDarkMode = (JSON.parse(model.isDarkMode) === true) ? false : true;
        localStorage.setItem("isDarkMode", model.isDarkMode);
        view.updateDarkMode(model.isDarkMode)
    }
}

//=====================================================================
// INIT

window.addEventListener("load", initGame);
function initGame() {
    model.PIANO_KEYS = [ 
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
    model.NUM_OF_KEYS = model.PIANO_KEYS.length;

    // Fetch piano samples
    for (let i = 0; i < model.NUM_OF_KEYS; i++) {
        let noteName = model.PIANO_KEYS[i].note;
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
    DARK_SWITCH.checked = JSON.parse(model.isDarkMode);
    RANDOM_SELECT.value = parseInt(localStorage.getItem("numOfRandom"));

    let noteState = (JSON.parse(model.isPreferSharp) === true) ? "noteSharp" : "note"; 
    view.initKeyNames(noteState);
    view.initReferenceList(noteState);
    view.updateDarkMode(JSON.parse(localStorage.getItem("isDarkMode")));
    view.initFeedback();

    // Can only call this after initReference above
    controller.shuffleAll();
}