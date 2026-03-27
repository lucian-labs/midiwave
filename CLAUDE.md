# midiwave — Universal MIDI Device Workbench

## What This Is

A browser-based tool for hands-on exploration of ANY MIDI controller. Connect a device, discover its capabilities, map controls, set LED colors, write to screens, and export configs for use in real apps.

Currently supports: **Novation Launch Control XL MK3** (fully mapped), with a plugin architecture for adding any MIDI device.

## Adding a New Device (for AI agents and humans)

When someone says "I have a [device], add support for it":

### Step 1: Research
1. Search for the device's **MIDI programmer's reference** or **MIDI implementation chart**
2. Look for: CC assignments, LED control method (CC/SysEx/NoteOn), screen protocol, identity response, port names
3. Check forums, GitHub repos, and manufacturer docs

### Step 2: Create device profile
1. Create `devices/<device-id>.json` following the schema in `devices/SCHEMA.md`
2. Fill in everything you can from documentation
3. Mark unknowns as `null` — the user will discover them interactively

### Step 3: Register in the app
1. Add the device to `DEFAULT_PROFILES` in `index.html` (or load from JSON)
2. The profile needs: `name`, `id`, `layout` (encoders/faders/buttons/pads with CCs), `led` (method + channel), `port_match` (for auto-detect)

### Step 4: Test with hardware
1. User loads the profile from the device dropdown
2. "Learn All" mode: move every control to confirm CC assignments
3. "Discover" mode: probe LED methods, screen protocols
4. Update the profile JSON with confirmed values

### Device Driver Abstraction
All hardware-specific communication goes through these methods, dispatched by `led.method` and `screen.method` in the profile:

- **LED**: `deviceSendLED(cc, colorValue)` — routes to CC, SysEx RGB, or NoteOn based on profile
- **Screen**: `deviceSendScreen(rows)` — routes to SysEx fields, CC values, or no-op
- **Identity**: `deviceProbeIdentity()` — sends universal SysEx identity request
- **DAW mode**: `deviceEnterDAW()` / `deviceExitDAW()` — sends profile-specific SysEx

### Key Principle
The device profile JSON is the **single source of truth**. The app reads it and adapts. No hardcoded device-specific logic in the main code — everything dispatches through the profile.

## Architecture

**Web MIDI API** in the browser — no backend, no install. A single HTML file (or small HTML+JS) that:

1. Enumerates MIDI devices via `navigator.requestMIDIAccess({ sysex: true })`
2. Lets the user select input + output ports from dropdowns
3. Provides interactive panels for each capability
4. Monitors all incoming MIDI and logs it live

## Panels

### 1. Device Connection
- Dropdown: select MIDI input port
- Dropdown: select MIDI output port
- "DAW Mode ON" / "DAW Mode OFF" buttons
- Connection status indicator

### 2. MIDI Monitor (Input)
- Live scrolling log of all incoming messages
- Columns: timestamp, type (CC/Note/SysEx), channel, data1, data2, hex
- Filter by message type
- Highlight: when a CC arrives, flash the corresponding entry
- "Learn" mode: click "Learn", then move a knob/press a button on the controller — captures the CC number + channel

### 3. OLED Screen Writer
- Text field for line 1
- Text field for line 2
- "Send" button — immediately pushes text to the LCXL3 OLED
- Target selector (0x35 default — the LCXL3 screen target)
- Arrangement selector (1 = two-line layout)
- Live preview of what's being sent (hex dump)

### 4. RGB LED Control
- Grid of buttons representing the LCXL3's 16 button positions (CC 37-52 in stock DAW mode, but allow arbitrary CC index input)
- Click a button → opens a color picker
- Color picker change → immediately sends RGB SysEx to that LED
- "All same color" button for quick fill
- Manual CC index input for non-standard button mappings

### 5. CC Sender
- Channel selector (1-16)
- CC number input
- Value slider (0-127)
- "Send" button + option for "send on slider move" (live)
- Useful for testing encoder relative mode enable/disable, etc.

### 6. SysEx Workbench
- Raw hex input field (space-separated bytes, auto-adds F0/F7 if missing)
- "Send" button
- Preset buttons for known LCXL3 commands:
  - DAW Mode ON: `F0 00 20 29 02 15 02 7F F7`
  - DAW Mode OFF: `F0 00 20 29 02 15 02 00 F7`
  - Relative Row 2 ON: CC ch7 #72 val 127
  - Relative Row 3 ON: CC ch7 #73 val 127
- Response log (incoming SysEx)

### 7. Export
- "Export Config" button → generates a JSON file:
```json
{
  "device": "Launch Control XL MK3",
  "daw_mode": true,
  "sysex_header": [240, 0, 32, 41, 2, 21],
  "buttons": {
    "play":    { "cc": 116, "channel": 1, "led_color": [0, 100, 10] },
    "rec":     { "cc": 118, "channel": 1, "led_color": [120, 10, 0] }
  },
  "encoders": {
    "row1": { "ccs": [13,14,15,16,17,18,19,20], "channel": 16, "mode": "absolute" },
    "row2": { "ccs": [29,30,31,32,33,34,35,36], "channel": 16, "mode": "relative" }
  },
  "faders": {
    "ccs": [77,78,79,80,81,82,83,84],
    "channel": 16
  },
  "screen": {
    "target": "0x35",
    "arrangement": 1
  }
}
```
- This JSON becomes the source of truth for waveloop's config.ini MIDI section, or any other app.

## Novation LCXL3 DAW Mode Protocol Reference

Everything below was reverse-engineered from the working waveloop C code (`midi_win.c`).

### SysEx Header
All LCXL3 SysEx messages start with: `F0 00 20 29 02 15`

### DAW Mode
- **Enter**: `F0 00 20 29 02 15 02 7F F7`
- **Exit**: `F0 00 20 29 02 15 02 00 F7`
- DAW mode changes the MIDI routing — input handle may need to be reopened after entering DAW mode (known issue in waveloop)
- In DAW mode, button presses send CCs on channel 1 (val > 0 = press)
- Faders send CCs on channel 16 (absolute 0-127)
- Encoders send CCs on channel 16 (absolute by default, relative if enabled)
- Page Up: CC 106 ch1, Page Down: CC 107 ch1

### Relative Encoder Mode
**Confirmed encoder CCs (DAW mode, ch16 for data, ch1 for LEDs):**
- Row 1: CC 13-20
- Row 2: CC 21-28
- Row 3: CC 29-36

Enable relative mode per row by sending CC on **channel 7** (0xB6):
- Row 1: CC 69 — `B6 45 7F` (on) / `B6 45 00` (off)
- Row 2: CC 72 — `B6 48 7F` (on) / `B6 48 00` (off)
- Row 3: CC 73 — `B6 49 7F` (on) / `B6 49 00` (off)

Relative values: center at 64. 65+ = clockwise, 63- = counter-clockwise. Delta = value - 64.

**IMPORTANT: Relative mode shifts CC numbers by +64 (0x40):**
- Row 1 relative: CC 77-84 (13+64 to 20+64)
- Row 2 relative: CC 85-92 (21+64 to 28+64)
- Row 3 relative: CC 93-100 (29+64 to 36+64)

**Encoder LED colors:** Same CC-on-ch1 system as buttons. Send CC 13-36 on ch1 with palette value 0-127. LED CC numbers do NOT shift — always use the base CC (13-36) for LEDs regardless of relative mode.

### RGB LED (SysEx — legacy, works via WinMM only)
SysEx LED commands work from waveloop (WinMM) but NOT from Web MIDI API.
```
F0 00 20 29 02 15 01 <cc_index> <R> <G> <B> F7
```
- R, G, B: 0-127 each

### LED Control (CC — confirmed working via Web MIDI)
**MK3 uses CC on channel 1 with a 128-color palette index:**
```
B0 <cc_index> <color_value>
```
- `cc_index`: the CC number of the button (37-52 for DAW mode buttons)
- `color_value`: 0-127 palette index
- Channel 1 = solid color
- Channel 2 = slow flash
- Channel 3 = fast flash
- Channel 4 = solid white (any value)
- Value 0 = LED off

**Color palette (approximate):**
| Values | Colors |
|--------|--------|
| 0 | Off |
| 1-3 | Dark grey, mid grey, white |
| 4-7 | Red (light to dark) |
| 8-11 | Orange (light to dark) |
| 12-15 | Yellow (light to dark) |
| 16-19 | Yellow-green (light to dark) |
| 20-23 | Neon green (light to dark) |
| 24-31 | Teal variations (light to dark) |
| 32-39 | Teal to bluish teal |
| 40-47 | Sky blue to rich blue |
| 48-55 | Purples to pinks |
| 56-59 | Fuscia |
| 60-127 | Mixed/compound colors |

### Identity Response
```
F0 7E 00 06 02 00 20 29 48 01 00 01 01 01 0B 39 F7
```
- Manufacturer: 00 20 29 (Novation/Focusrite)
- Device family: 0x48
- SysEx device ID 0x15 still works for DAW mode ON/OFF but NOT for LED/screen

### OLED Screen (SysEx — confirmed working via Web MIDI)

**3-row display using arrangement 2, separate SysEx per field:**

**Step 1 — Configure display:**
```
F0 00 20 29 02 15 04 35 02 F7
```
- Target: 0x35, Arrangement: 0x02

**Step 2 — Set text per row (separate SysEx messages):**
```
F0 00 20 29 02 15 06 35 00 <top row ASCII> F7    (field 0x00 = top)
F0 00 20 29 02 15 06 35 01 <mid row ASCII> F7    (field 0x01 = middle)
F0 00 20 29 02 15 06 35 02 <bot row ASCII> F7    (field 0x02 = bottom)
```

**Step 3 — Trigger display (re-send top text without field byte):**
```
F0 00 20 29 02 15 06 35 <top row ASCII> F7
```

**Arrangement reference:**
- Arr 1: field 0=middle(centred), field 1=bottom
- Arr 2: field 0=top, field 1=middle, field 2=bottom (ALL 3 ROWS)
- Arr 3: field 0=top(centred), field 1=middle(left-aligned)
- Arr 4: concatenates fields on top, stray "0" on bottom

**Note:** Text only appears after pressing Mode button on LCXL3 (DAW overlay hides custom text). Waveloop keeps text visible by re-sending continuously.

### Known LCXL3 Port Names (Windows)
- **LCXL3 1 MIDI** — standalone port (LED CC works here)
- **MIDIIN2 (LCXL3 1 MIDI)** — DAW input port
- **MIDIOUT2 (LCXL3 1 MIDI)** — DAW output port (DAW mode, relative encoders, LED CC)
- **MIDIOUT3/4 (LCXL3 1 MIDI)** — additional ports
- **MIDIIN (Launch Control XL MK3)** — old naming, standalone input port
- **MIDIOUT (Launch Control XL MK3)** — standalone output port

DAW mode only works on the MIDIIN2/MIDIOUT2 pair. Opening the wrong port is a common source of "nothing works."

### Initialization Sequence (what waveloop does)
1. Enumerate devices, find MIDIIN2 + MIDIOUT2 with "Launch Control" in name
2. Open output (MIDIOUT2)
3. Open input (MIDIIN2) — must be opened/reopened after output is ready
4. Send DAW mode ON sysex
5. Enable relative encoders (rows 2+3)
6. Configure + send screen text
7. Begin sending RGB LED updates

**Critical**: The input handle opened before DAW mode entry may be stale. In waveloop, reopening the input after the output is established and before DAW mode entry fixes MIDI input not working. The browser Web MIDI API may not have this issue since it doesn't use WinMM handles.

## Tech Stack

- Single `index.html` with inline CSS + JS
- Web MIDI API (Chrome/Edge — requires HTTPS or localhost, sysex: true)
- No dependencies, no build step
- Can be opened as a local file or served from any static host

## File Location

```
waveloop/windows/tools/midi-lab/
├── index.html      # the entire app
└── CLAUDE.md       # this file
```
