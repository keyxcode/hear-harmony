# Hear Harmony
### Video Demo: https://youtu.be/YyhchssUR-s

---

### Description

[**Hear Harmony**](https://keyxcode.github.io/hear-harmony/) was developed to help musicians improve their *relative pitch*. 

*Relative pitch* is the ability to identify one or many given musical notes by comparing them to a reference note. This can be developed through ear training.

---

### How To Use

<img src="Images/mainButtons.png" alt="Main buttons" style="height: 100px"/>

*Main buttons*

On the ***Train*** page, press *"Reference"* to listen the reference note, which you could either choose yourself or let the program automatically pick for you. Then, press *"Play"*, which plays from one to five random notes, depending on the number of notes you select. Next, play your guesses on the on-screen piano until you get all of them right.

After you get the answer right, press *"Shuffle"* to get a new set of random notes. If the challenge is too difficult, you could press *"Answers"*, which reveals the notes to you.

<img src="Images/toggleSwitches.png" alt="Main buttons" style="height: 100px"/>

*Toggle switches*

The *"Prefer sharp spelling"* switch toggles between flat and sharp spelling for the on-screen note names.

The *"Static reference note"* switch determines whether or not the reference note changes when you *"Shuffle"*. This might be useful when you want to train your ear against a specific note, for example F3.

If you are looking for an extra challenge, try turning on the *"Random number of random notes"* switch. This will hide the number of random notes from you, and will also change this number each time you *"Shuffle"*. The purpose of this switch is to help you get used to distinguishing the texture of 2-note chords, 3-note chords, 4-note chords, etc. without knowing this number in advance. More than once in the past I have asked myself when transcribing chords: "I think I heard 3 notes, but I'm not sure if that's all of them." This mode is designed to hopefully help with that feeling. 

---

### Pro-tip

You could play the on-screen piano using your computer keyboard. The lower octave starts with "Z" as C3 and the upper octave starts with "Q" as C4. See if you could figure out how they map to the rest of the piano!

---

### Technical Details

This website was implemented using HTML, CSS with the Boostrap framework, and JavaScript. A lot of work was put into assuring a flawless experience on desktop as well as mobile devices, especially when it comes to interacting with the on-screen piano. In the end, the scrolling piano design was chosen for mobile because it offers the most compact, easy-to-use, as well as aesthetically pleasing design.

<img src="Images/desktopUI-light.png?" alt="Desktop UI - light mode"/>

*Desktop UI - Light Mode*

<img src="Images/mobileUI-dark.png?" alt="Mobile UI - dark mode" style="height: 500px"/>

*Mobile UI - Dark Mode*

When it comes to JavaScript, two challenges I faced were how to organize the game logic, and how to implement the audio engine.

At the beginning, there was barely any organization to the code. As the program grew, I soon found out that it was too difficult to navigate and manage as there was too much dependency between different functions and variables. After some research, I found a good way to help with this is to utilize an MVC model, putting components in a fitting namespace: Model, View, or Controller. The end result is still not perfect, but is much easier to navigate than what it originally was.

The other challenge was how to implement the audio engine. At the beginning, I used HTML `<audio>` tag to play piano samples. However, I soon found out that it did not offer the best playback for short samples, so I ended up using the Web Audio API instead. Another thing I tried to implement is to emulate the piano key behavior as realistically as possible. This means that if you press a note quickly, it will give you a short release, while holding a note for a long time will lengthen the tail. Many other piano web apps I came across default to either one of those two behaviors: always short notes, or always long notes for simplicity.

I considered building a backend for users to log in to this app, but after further consideration, decided that it was not necessary for the purpose of this site, and would only add unwanted complexities for both myself and the users. In the end, the only backend I use is Formspree's service where I point the contact form to.

---

### Philosophy

**Hear Harmony** is unique in that it does not restrict the random notes to only conventional combinations, such as major, minor, diminished, etc. I believe that true relative pitch means being able to hear any strange note combination. Besides, this will be especially helpful for musicians who want to enrich their harmonic vocabulary. Sometimes, the chord you can not name is the one you wish you could use.

Happy ear training! 🎹