# midiwave Social Content — March 21, 2026

---

## TikTok (scrappy, raw, talking-to-camera energy)

### Video 1 — "The Assault"
> ok so novation doesn't document their MIDI LED protocol for the LCXL3 MK3.
> so me and claude literally sent CC messages on every channel to every port.
> 64 combinations. just blasting the thing.
> and then button 5 just... lit up white.
> turns out the whole thing is CC-based, not SysEx.
> the entire internet was wrong.
> one single friday night and we reverse-engineered the whole protocol.
> *[show sparkle mode]*
> yeah that's 128 colors. you're welcome.

### Video 2 — "screen discovery"
> been trying to get text on this OLED for like an hour.
> sending every SysEx format i can think of. nothing.
> then i see "test" flash on the screen after pressing Mode.
> the text was there THE WHOLE TIME.
> the DAW mode overlay was just hiding it.
> so the sysex was working. i just couldn't see it.
> spent another hour finding out there are THREE rows.
> arrangement 2, fields 0, 1, 2. JULIET KILO LIMA.
> *[show 3-row text on OLED]*

### Video 3 — "sparkle for the gram"
> *[just the sparkle animation, 10 seconds, no talking, trending audio]*
> caption: built a MIDI light show in one HTML file. no framework. no build step. just vibes and SysEx.

---

## Instagram (clean, polished, studio aesthetic)

### Post 1 — Carousel (3-5 slides)
**Slide 1:** Close-up of LCXL3 with sparkle mode running, moody lighting
**Slide 2:** Terminal with scrolling MIDI logs, code visible
**Slide 3:** Browser showing midiwave UI with LED grid
**Slide 4:** OLED screen showing "JULIET / KILO / LIMA"
**Slide 5:** The final palette — all 128 colors across 16 buttons

**Caption:**
Built midiwave — a browser-based MIDI workbench for reverse-engineering controller protocols.

One Friday night. One HTML file. Zero documentation from Novation.

Discovered:
- 128-color LED palette via CC (not SysEx like everyone assumed)
- 3-row OLED screen control
- Relative encoder CC offset (+64)
- Flash modes on channels 2-3

The entire LCXL3 MK3 DAW protocol, documented for the first time.

Open source: github.com/lucian-labs/midiwave

#midi #musictech #webmidi #novation #launchcontrol #reverseengineering #musicproduction #opensource #lucianlabs #buildnight

### Post 2 — Reel
Clean edit of sparkle mode → screen text → LED palette sweep. Studio lighting, close macro shots of the hardware. Minimal text overlays.

**Caption:**
128 colors. 3-row OLED. One HTML file.

midiwave — reverse-engineering MIDI controllers from the browser.

#midi #controller #rgb #musicgear

---

## Threads (conversational, builder energy)

### Thread 1
Novation doesn't document the LCXL3 MK3 DAW protocol. Not the LEDs, not the screen, not the encoder modes. You're supposed to use their Ableton/Logic scripts and not ask questions.

So we built midiwave — a browser tool that lets you poke at MIDI hardware live. Send a command, see what happens.

First discovery: LEDs aren't SysEx at all. They're standard CC messages on channel 1. We found this by literally sending CC to every channel on every port. Button 5 lit up white. One line in a 64-attempt brute force.

Second: the OLED has 3 rows, not 2. Arrangement byte 0x02, separate SysEx per field. Nobody has documented this.

Third: relative encoder mode shifts CC numbers by +64. So your row 2 encoders jump from CC 21-28 to CC 85-92. Also undocumented.

Built the whole thing in one session with Claude as pair programmer. It's one HTML file with inline JS. No React. No build step. Just Web MIDI API and determination.

github.com/lucian-labs/midiwave

### Thread 2
The best moment from last night: we'd been trying to get text on the LCXL3 screen for an hour. Sending SysEx, getting nothing. Then I pressed the Mode button and saw "test" flash for a second.

The text was being received the entire time. The DAW mode overlay was just painting over it. Every. Single. Time.

Sometimes the bug is that it's working and you don't know.

---

## Facebook Groups (educational, helpful, community-first)

### Post for MIDI / Music Tech groups
**Title:** Free tool for reverse-engineering MIDI controllers (+ LCXL3 MK3 protocol docs)

Hey everyone — I built an open-source browser tool called midiwave for exploring MIDI devices. It uses the Web MIDI API so there's nothing to install — just open it in Chrome.

Features:
- Live MIDI monitor with CC/Note/SysEx filtering
- LED color control (128-color palette for Novation devices)
- OLED screen writer (3-row text for LCXL3)
- CC sender with live slider mode
- SysEx workbench with presets
- Config export to JSON

I also documented the entire Novation LCXL3 MK3 DAW mode protocol, which Novation doesn't publish. If you've been trying to control LEDs or the screen from your own software, the answer is:
- LEDs are CC on channel 1, value 0-127 (color palette index)
- Screen is SysEx with arrangement 2 and separate field messages
- Relative encoders shift CCs by +64

Full protocol reference: [link to blog/protocol-reference]
Tool: github.com/lucian-labs/midiwave

Works with any MIDI controller, not just Novation. Happy to answer questions.

### Post for Ableton / DAW groups
**Title:** Controlling LCXL3 MK3 LEDs and screen from your own code

If you've been frustrated by the lack of documentation for the Launch Control XL MK3's DAW mode — I spent a Friday night reverse-engineering the whole thing.

Key finding: the MK3 doesn't use SysEx for LEDs (unlike what you'd expect from the MK2). It's simple CC messages:
- CC on channel 1 with value 0-127 = color palette index
- CC on channel 2 = slow flash
- CC on channel 3 = fast flash

The OLED screen takes SysEx but with a specific arrangement byte (0x02 for 3 rows) and separate messages per row.

Built a browser tool to test all this live: github.com/lucian-labs/midiwave

Full protocol docs included. Hope this saves someone else the headache.

---

## Reddit

### r/midi
**Title:** I reverse-engineered the Novation LCXL3 MK3 DAW mode protocol — LEDs, OLED screen, encoder modes. Here's everything.

Novation doesn't document the DAW mode protocol for the Launch Control XL MK3. If you want to control LEDs, write to the OLED, or understand the encoder behavior from your own code — you're on your own.

So I built [midiwave](https://github.com/lucian-labs/midiwave), a browser-based MIDI workbench, and used it to figure everything out in one session.

**Key discoveries:**

- **LEDs are NOT SysEx.** They're CC on channel 1. Value = color palette index (0-127). Ch2 = slow flash, ch3 = fast flash.
- **The OLED has 3 rows.** Arrangement byte 0x02, fields 0x00/0x01/0x02 in separate SysEx messages.
- **Relative mode shifts CCs by +64.** Row 2 goes from CC 21-28 to CC 85-92.
- **Device family is 0x48**, not 0x15 (that's the MK2).

Full protocol reference in the repo. Tool is one HTML file, no dependencies, Web MIDI API.

Built with the help of Claude (AI pair programmer) — we literally brute-forced CC messages across every port and channel until a button lit up.

### r/synthdiy or r/musicprogramming
**Title:** Web MIDI API + SysEx + Friday night = fully documented LCXL3 MK3 protocol

[same content, more technical angle, include hex dumps]

### r/ableton
**Title:** PSA: LCXL3 MK3 LED colors are CC-based, not SysEx. Full DAW mode protocol documented.

If you're building custom control scripts for the Launch Control XL MK3, you might be trying SysEx for LED control (like the MK2). It doesn't work. The MK3 uses standard CC messages on channel 1 with a 128-color palette.

Documented the whole protocol: [link]
Built a browser tool for testing: [link]

---

## Key Quotes for Any Platform

> "let's do a full frontal assault on this thing"

> "button 5 is white from something in here"

> "omg i see 'test' but idk where it came from"

> "wtf my encoder rows 2 and 3 are suddenly cc 85-100?"

> "JULIET KILO LIMA — each row centred"

> "the entire internet was wrong about how MK3 LEDs work"

> "one HTML file. no framework. no build step. just vibes and SysEx."

---

## Hashtag Sets

**Technical:** #midi #webmidi #sysex #reverseengineering #musictech #novation #launchcontrol #lcxl3 #opensource
**Creative:** #buildnight #fridaynightlabs #musicproduction #controller #rgb #lightshow
**Brand:** #lucianlabs #midiwave #waveloop
