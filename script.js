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
if (!localStorage.getItem("isRandomNumOfRandom")) {
    localStorage.setItem("isRandomNumOfRandom", false);
}

//=====================================================================
// MODEL: the backend, generates random notes, plays samples and manages game state. 
// Processes notes as number indexes (0 -> NUM_OF_KEYS)
// communicates with CONTROLLER

let model = {
    // game states for reference
    // gameState: {0: "init", 1: "won", 2: "correct", 3: "incorrect", 4: "duplicated"},

    // piano model is init on load
    PIANO_KEYS: [],
    NUM_OF_KEYS: 0,

    CTX: new (window.AudioContext || window.webkitAudioContext)(),
    MASTER_GAIN: 0, // init on load

    fetchedSamples: [], // init on load
    pianoVoices: [], // init on load
    numPianoVoices: 48,
    activeVoiceID: 0,

    randomNoteIndexes: [],
    randomNoteIndexesCopy: [],

    totalNumOfRandom: 5,
    numOfRandom: parseInt(localStorage.getItem("numOfRandom")),
    correctCount: 0,
    isGuessing: false,

    referenceNoteID: localStorage.getItem("referenceNoteID"),
    isPreferSharp: localStorage.getItem("isPreferSharp"),
    isStaticRef: localStorage.getItem("isStaticRef"),
    isRandomNumOfRandom: localStorage.getItem("isRandomNumOfRandom"),
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

    shuffleNumOfRandom: function() {
        randomNumber = Math.floor(Math.random() * model.totalNumOfRandom) + 1;
        localStorage.setItem("numOfRandom", randomNumber);
        model.numOfRandom = parseInt(localStorage.getItem("numOfRandom"));
    },

    playNoteSound: function(id) {
        let voiceID = this.activeVoiceID;
        let pianoVoices = this.pianoVoices;

        // Load sample into the voice slot
        pianoVoices[voiceID].node = this.CTX.createBufferSource();
        pianoVoices[voiceID].node.buffer = this.fetchedSamples[id];
        // Initialize gain fader
        pianoVoices[voiceID].gainFader.gain.value = 1;
        pianoVoices[voiceID].node.connect(this.pianoVoices[voiceID].gainFader);
        // Play note and set active
        pianoVoices[voiceID].node.start(model.CTX.currentTime);
        pianoVoices[voiceID].isActive = true;
        // Get the next active voice ID to stream the next sample
        this.activeVoiceID = (this.activeVoiceID + 1) % this.numPianoVoices;
    },

    stopPianoSound: function() {
        this.pianoVoices.forEach(voice => {
            if (voice.isActive == true) {
                // Fade out
                currentTime = model.CTX.currentTime;
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
    REFERENCE_PLAY: document.querySelector("#reference"),
    REFERENCE_SELECT: document.querySelector("#reference-select"),
    RANDOM_PLAY: document.querySelector("#random"),
    RANDOM_SELECT: document.querySelector("#num-of-random"),
    SHUFFLE: document.querySelector("#shuffle"),
    ANSWER: document.querySelector("#answer"),
    SHARP_SWITCH: document.querySelector("#sharp-switch"),
    STATIC_REF_SWITCH: document.querySelector("#static-ref-switch"),
    RANDOM_NUM_RANDOM_SWITCH: document.querySelector("#random-num-of-random"),
    DARK_SWITCH: document.querySelector("#dark-switch"),

    // Arrays of key divs on screen to look up touch/ mouse input
    KEY_DIVS: document.querySelectorAll(".key"),
    // Array of computer keys to look up key input
    COMPUTER_KEYS: [
        "z", "s", "x", "d", "c", "v", "g", "b", "h", "n", "j", "m", 
        "q", "2", "w", "3", "e", "r", "5", "t", "6", "y", "7", "u", "i"
    ],

    FEEDBACK1: document.querySelector("#feedback1"),
    FEEDBACK2: document.querySelector("#feedback2"),

    feedbackMessage1: function(msg) {
        this.FEEDBACK1.innerHTML = msg;
    },

    feedbackMessage2: function(msg) {
        this.FEEDBACK2.innerHTML = msg;
    },

    initFeedback: function() {
        this.feedbackMessage1("First, listen to the \"Reference.\"");
        this.feedbackMessage2 ("Then, \"Play\" and press the note(s) you hear.");
    },

    changeNoteColor: function(id) {
        let key = this.KEY_DIVS[id];
        key.classList.add("active");
    },

    initKeyNames: function(noteState) {
        for (let [i, key] of this.KEY_DIVS.entries()) {
                key.innerHTML = model.PIANO_KEYS[i][noteState];
        }
    },
    
    initReferenceList: function(noteState) {
        let referenceNotes = Array.from(document.querySelectorAll("#referenceNote"));

        // If the options don't exist yet, init them 
        if (referenceNotes.length === 0) {
            for (let i = 0; i < model.NUM_OF_KEYS; ++i) {
                let option = document.createElement("option");
                option.value = i;
                option.id = "referenceNote"
                referenceNotes.push(option);
                this.REFERENCE_SELECT.add(option);
            }
        }
        
        // Name the options. Separated to support sharp-flat toggle
        for (let [i, option] of referenceNotes.entries()) {
            option.text = model.PIANO_KEYS[i][noteState];
        }
    },

    initNumOfRandomList: function() {
        let numOfRandomOptions = Array.from(document.querySelectorAll("#numOfRandomOption"));
        if (numOfRandomOptions.length === 0) {
            for (let i = 0; i < model.totalNumOfRandom; ++i) {
                let option = document.createElement("option");
                option.value = i + 1;
                option.text = i + 1;
                option.id = "numOfRandomOption"
                this.RANDOM_SELECT.add(option);
            }
        }

        let questionMark = document.querySelector("#questionMark");
        if (questionMark) questionMark.parentNode.removeChild(questionMark);

    },

    initNumOfRandomListHidden: function() {
        let numOfRandomOptions = Array.from(document.querySelectorAll("#numOfRandomOption"));
        if (numOfRandomOptions.length > 0) {
            numOfRandomOptions.forEach(e => {
                e.parentNode.removeChild(e);
            })
        }

        let questionMark = document.createElement("option");
        questionMark.text = "?";
        questionMark.id = "questionMark";
        questionMark.setAttribute("selected", "selected");
        this.RANDOM_SELECT.add(questionMark);
    },

    updateSharpFlat: function(noteState) {
        this.initKeyNames(noteState);
        this.initReferenceList(noteState);
    },

    bgColor: getComputedStyle(document.documentElement).getPropertyValue("--bg-color"),
    whiteKeyColor: getComputedStyle(document.documentElement).getPropertyValue("--white-key-color"),
    whiteKeyActiveColor: getComputedStyle(document.documentElement).getPropertyValue("--white-key-active-color"),
    blackKeyColor: getComputedStyle(document.documentElement).getPropertyValue("--black-key-color"),
    blackKeyActiveColor: getComputedStyle(document.documentElement).getPropertyValue("--black-key-active-color"),

    renderDarkModeGlobal: function(isDarkMode) {
        let body = document.querySelector("body");
        let navBarAndFooter = document.querySelectorAll(".navbar, footer");
        let navBarAndFooterText = document.querySelectorAll(".navbar-brand, footer div, footer a");

        if (isDarkMode === true) {
            body.style.backgroundColor = this.blackKeyColor;
            navBarAndFooter.forEach(el => el.style.backgroundColor = this.blackKeyActiveColor);
            navBarAndFooterText.forEach(el => el.style.color = this.whiteKeyActiveColor);
        } else {
            body.style.backgroundColor = this.bgColor;
            navBarAndFooter.forEach(el => el.style.backgroundColor = this.blackKeyColor);
            navBarAndFooterText.forEach(el => el.style.color = this.whiteKeyColor);
        }
    },
    
    renderDarkModeTrain: function(isDarkMode) {
        this.renderDarkModeGlobal(isDarkMode);

        let toggleText = document.querySelector(".toggles");
        if (isDarkMode === true) {
            toggleText.style.color = this.whiteKeyColor;
        } else {
            toggleText.style.color = this.blackKeyColor;
        }

        this.renderPianoBG();
    },

    mediaQuery: window.matchMedia("(max-width: 768px)"),
    renderPianoBG() {
        let piano = document.querySelector(".piano");
        let scrollText = document.querySelector("#scroll");
        // Screen size small & dark mode
        if (this.mediaQuery.matches && JSON.parse(model.isDarkMode)) {
            piano.style.backgroundColor = this.blackKeyActiveColor;
            scrollText.style.color = this.whiteKeyColor;
            // Screen size small & not dark mode
        } else if (this.mediaQuery.matches && !JSON.parse(model.isDarkMode)) {
            piano.style.backgroundColor = this.blackKeyColor;
            scrollText.style.color = this.whiteKeyActiveColor;
            // Screen size big
        } else { 
            piano.style.backgroundColor = null;
            scrollText.style.color = null;
        }
    }
}

//=====================================================================
// EVENT HANDLERS
// detects user input to send over to CONTROLLER

function initEventHandlers() {
    // Piano Mouse Input handler
    view.KEY_DIVS.forEach(key => {
        key.addEventListener("pointerdown", e => controller.parsePianoMouseInput(e));
    });
    document.addEventListener("pointerup", () => controller.stopAudioVisual());

    // Piano Computer Keyboard Input handlers
    document.addEventListener("keydown", e => controller.parsePianoKeyInput(e));
    document.addEventListener("keyup", () => controller.stopAudioVisual());

    // Utility buttons handlers
    view.REFERENCE_PLAY.addEventListener("click", () => controller.playReference());
    view.REFERENCE_SELECT.addEventListener("change", e => controller.updateRefID(e.target.value));
    view.RANDOM_PLAY.addEventListener("click", () => controller.playRandom());
    view.RANDOM_SELECT.addEventListener("change", () => controller.selectNumRandom());
    view.SHUFFLE.addEventListener("click", () => controller.shuffleAll());
    view.ANSWER.addEventListener("click", () => controller.showAnswer());

    // Toggle Switches
    view.SHARP_SWITCH.addEventListener("click", () => controller.updateNoteState());
    view.STATIC_REF_SWITCH.addEventListener("click", () => controller.updateRefState());
    view.RANDOM_NUM_RANDOM_SWITCH.addEventListener("click", () => controller.updateNumOfRandomState());
    view.DARK_SWITCH.addEventListener("click", () => controller.updateDarkMode());

    // Responsive Piano
    view.mediaQuery.addEventListener("change", () => view.renderPianoBG());
}


//=====================================================================
// CONTROLLER: lets user interact with the MODEL by guessing
// sends messages to VIEW calls VIEW methods upon changes
// Process key and mouse input and turn them into integers 0 -> NUM_OF_KEYS

let controller = {
    parsePianoMouseInput: function(e) {
        // Get the note id from the key div id
        let id = (Array.from(view.KEY_DIVS)).indexOf(e.target);
        this.processNote(id);
    },

    parsePianoKeyInput: function(e) {
        // Safety check: don't repeat note if key is still pressed
        if (e.repeat) return;

        // Get the note id from the computer key id
        const computerKey = e.key;
        let id = view.COMPUTER_KEYS.indexOf(computerKey);
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
        view.REFERENCE_SELECT.value = referenceNoteID;
        model.referenceNoteID = referenceNoteID;
        localStorage.setItem("referenceNoteID", referenceNoteID);
    },

    playReference: function() {
        let id = parseInt(view.REFERENCE_SELECT.value);
        this.playPiano(id);
    },

    playRandom: function() {
        // Play all the random notes in the array
        model.randomNoteIndexesCopy.forEach((id) => model.playNoteSound(id));
        model.isGuessing = true;    
    },

    selectNumRandom: function() {
        // Write the new num of random to local storage and update model
        localStorage.setItem("numOfRandom", view.RANDOM_SELECT.value);
        model.numOfRandom = parseInt(localStorage.getItem("numOfRandom"));

        // shuffle the random array everytime the number of random notes is changed
        model.shuffleRandomNotesArray(); 
    },

    shuffleAll: function () {
        if (!JSON.parse(model.isStaticRef)) model.shuffleReference()
        else controller.updateRefID(model.referenceNoteID);

        if (JSON.parse(model.isRandomNumOfRandom)) model.shuffleNumOfRandom();

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
                if (JSON.parse(model.isRandomNumOfRandom)) {
                    view.feedbackMessage2("Keep guessing.");
                } else {
                    view.feedbackMessage2((notesLeft) + " more to go.");
                };
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

    updateNumOfRandomState: function() {
        if (JSON.parse(model.isRandomNumOfRandom) === true) {
            model.isRandomNumOfRandom = false;
            view.initNumOfRandomList();
        } else if (JSON.parse(model.isRandomNumOfRandom) === false) {
            model.isRandomNumOfRandom = true;
            view.initNumOfRandomListHidden();
        }

        localStorage.setItem("isRandomNumOfRandom", model.isRandomNumOfRandom);
    },

    updateDarkMode: function() {
        model.isDarkMode = (JSON.parse(model.isDarkMode) === true) ? false : true;
        localStorage.setItem("isDarkMode", model.isDarkMode);
        view.renderDarkModeTrain(model.isDarkMode)
    }
}

//=====================================================================
// INIT

window.addEventListener("load", () => {
    if (document.querySelector("body").dataset.title === "train-page") {
        initGame();
        return;
    }

    view.renderDarkModeGlobal(JSON.parse(model.isDarkMode));
});

function initGame() {
    // Initialize piano model
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

    // Initialize audio engine
    model.MASTER_GAIN = model.CTX.createGain();
    model.MASTER_GAIN.gain.value = 0.7;
    model.MASTER_GAIN.connect(model.CTX.destination);

    // Fetch piano samples
    for (let i = 0; i < model.NUM_OF_KEYS; i++) {
        let noteName = model.PIANO_KEYS[i].note;
        fetch(`Weber Baby Grand keyxcode/${noteName}.mp3`)
        .then(data => data.arrayBuffer())
        .then(arrayBuffer => model.CTX.decodeAudioData(arrayBuffer))
        .then(decodedAudio => {
            let audio = decodedAudio;
            model.fetchedSamples[i] = audio;
        })
        .then(() => {
            // Shuffle all after all the samples are loaded
            if (model.fetchedSamples.length === 25) controller.shuffleAll();
        })  
    }

    // Init the voice manager/ mixer
    for (let i = 0; i < model.numPianoVoices; i ++) {
        let gainFader = model.CTX.createGain();
        gainFader.connect(model.MASTER_GAIN);
        model.pianoVoices.push({voiceID: `${i}`, isActive: false, node: null, gainFader: gainFader});
    }

    // Init eventhandlers
    initEventHandlers();
    
    // Init GUI
    view.feedbackMessage1("<i>Loading</i>")
    view.feedbackMessage2("...");

    view.SHARP_SWITCH.checked = JSON.parse(model.isPreferSharp);
    view.STATIC_REF_SWITCH.checked = JSON.parse(model.isStaticRef);
    view.RANDOM_NUM_RANDOM_SWITCH.checked = JSON.parse(model.isRandomNumOfRandom);
    view.DARK_SWITCH.checked = JSON.parse(model.isDarkMode);
    view.RANDOM_SELECT.value = parseInt(model.numOfRandom);

    let noteState = (JSON.parse(model.isPreferSharp) === true) ? "noteSharp" : "note"; 
    view.initKeyNames(noteState);
    view.initReferenceList(noteState);

    if (JSON.parse(model.isRandomNumOfRandom)) {
        view.initNumOfRandomListHidden()
    } else {
        view.initNumOfRandomList()
    };

    view.renderDarkModeTrain(JSON.parse(model.isDarkMode));    
}