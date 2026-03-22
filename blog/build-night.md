# midiwave Build Night: Reverse-Engineering the LCXL3 MK3 with Claude

**Date:** March 21, 2026
**Duration:** ~3 hours (8pm–11pm)
**Vibe:** Friday night, hardware on the desk, terminal scrolling, lights going off

---

## The Problem

The Novation Launch Control XL MK3 has an OLED screen, RGB LEDs on every button and encoder, DAW mode with custom routing — and almost zero public documentation for any of it. Novation provides DAW integration scripts for Ableton and Logic, but if you want to control the hardware yourself? Good luck.

We'd already reverse-engineered some of the SysEx protocol for waveloop (our C-based audio engine), but it was time to build a proper workbench. A browser-based tool where you can poke at the device live — try a SysEx command, see what happens, change an LED, write to the screen.

Enter midiwave.

---

## Timeline

### 20:15 — First Contact
Spun up the server. Web MIDI API enumerates 7 inputs, 9 outputs. The LCXL3 shows up as three output ports: LCXL3 1 MIDI, MIDIOUT2, MIDIOUT3, MIDIOUT4. Connected to MIDIOUT2 (the DAW port). DAW mode ON — the device echoes back confirmation via SysEx.

### 20:15–20:18 — Color Palette Discovery
We knew LEDs existed. We assumed they were SysEx-controlled (like the old MK2). Tried the waveloop SysEx format: `F0 00 20 29 02 15 01 <cc> <R> <G> <B> F7`. Nothing. Tried alternate device IDs. Nothing.

Identity request came back: device family `0x48`, not `0x15`. Tried the new ID. Still nothing for LEDs.

### 20:02 — The Assault
"Let's do a full frontal assault on this thing."

Built a probe that sends CC messages on every channel (1-16) to every output port, hitting CC 41. 64 combinations. Somewhere in the barrage — button 5 lit up white.

> `20:02:48 [assault] CC LED port=LCXL3 1 MIDI ch1 cc=41 val=127`
> `20:02:52 [assault-in] LCXL3 1 MIDI: B0 29 7F`

**LEDs are CC-based, not SysEx.** Channel 1, value = color palette index. The entire MK2 assumption was wrong.

### 20:10 — Channel Discovery
Sent targeted CC messages on channels 1-4:
- **Ch1:** solid orange (val 127 = color index)
- **Ch2:** slow flashing orange
- **Ch3:** fast flashing
- **Ch4:** solid white

Ch5-8: nothing. Ch16: the screen showed "0". Wait — **CC on ch16 affects the screen?**

### 20:15–20:18 — The Full Palette
Swept values 0-127 across 16 buttons, 8 batches. The entire Novation 128-color palette revealed itself in real time:

- 0: off. 1-3: grey ramp to white
- 4-7: reds. 8-11: oranges. 12-15: yellows
- 16-19: yellow-green. 20-23: neon green. 24-39: teals
- 40-47: sky blue to deep blue. 48-55: purples to pinks
- 56-127: fuchsia, compound colors, the weird stuff

### 20:37 — Encoder Surprise
"wtf my encoder rows 2 and 3 are suddenly cc 85-100?"

Relative mode shifts CC numbers by +64. Row 2 goes from CC 21-28 to CC 85-92. This is documented nowhere. The encoder LEDs respond to CC on ch1 using the BASE CC (13-36), not the shifted ones.

### 20:48 — Screen Attempts Begin
Sent the waveloop SysEx format for screen text. Logged it perfectly in the terminal. Nothing on the OLED. Tried different arrangements, different field bytes. Nothing.

### 20:49 — Sparkle Mode
Needed a break. Built a sparkle animation — random LED colors on every button and encoder, cycling every 100ms. Ten seconds of pure RGB chaos. The gram demands content.

### 21:12 — "omg i see 'test'"
After dozens of failed screen attempts, text appeared. But only after pressing the Mode button on the hardware. The DAW mode display overlay was hiding our custom text the whole time. The SysEx WAS working — we just couldn't see it.

### 21:17–21:40 — Arrangement Archaeology
Systematic combo testing. Config arrangement 1-4, different field byte formats, waveloop format vs newline format vs separate messages. Each test shows its ID on the screen so we know which one worked.

Discoveries:
- Arr 1: field 0 = middle row, field 1 = bottom
- Arr 2: field 0 = top, field 1 = middle, field 2 = bottom (ALL THREE ROWS)
- Arr 3: field 0 = top centered, field 1 = middle left-aligned
- Arr 4: concatenates everything on top, stray "0" on bottom

### 21:42 — JULIET KILO LIMA
The NATO phonetic alphabet test. Arrangement 2, fields 0x00/0x01/0x02, separate SysEx per field:

> Row 1 (top): JULIET
> Row 2 (middle): KILO
> Row 3 (bottom): LIMA

All three rows. All centered. The OLED is fully ours.

### 21:55–21:58 — Final Sparkle
Everything working. LEDs cycling through the palette, screen scrolling text, sparkle mode finale. Four sparkle runs in three minutes because the first one cut off "to bed" at the end.

---

## What We Discovered

| Feature | Assumption | Reality |
|---------|-----------|---------|
| LED control | SysEx with RGB values | CC on ch1, 128-color palette index |
| LED flash modes | N/A | Ch2 = slow flash, ch3 = fast flash |
| Device ID | 0x15 (MK2) | 0x48 (MK3 family) |
| Screen text | Single SysEx with embedded fields | Separate SysEx per field + trigger message |
| Screen visibility | Always visible | Hidden behind DAW mode overlay |
| Screen rows | 2 lines | 3 rows (arr 2, fields 0/1/2) |
| Relative CC offset | Unknown | +64 (0x40) per row |
| Encoder LED CC | Shifted with mode | Always base CC (13-36) |
| Page up/down | Unknown | CC 106/107 on ch1 |

## The Stack

One HTML file. No framework. No build step. Web MIDI API with `sysex: true`. A 40-line Node server for terminal logging. Chrome on Windows.

The entire protocol was reverse-engineered in a single Friday night session with an AI pair programmer and a healthy disregard for documentation that doesn't exist.

---

*Built at Lucian Labs. The LCXL3 MK3 OLED still shows JULIET KILO LIMA.*
