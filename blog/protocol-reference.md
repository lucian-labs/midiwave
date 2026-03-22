# LCXL3 MK3 DAW Mode Protocol — The Missing Manual

**Date:** March 21, 2026
**Status:** Reverse-engineered, confirmed working via Web MIDI API

---

Everything below was discovered through live experimentation with the Novation Launch Control XL MK3 in DAW mode. None of this is in Novation's public documentation.

## Device Identity

```
Request:  F0 7E 7F 06 01 F7
Response: F0 7E 00 06 02 00 20 29 48 01 00 01 01 01 0B 39 F7
```

- Manufacturer: `00 20 29` (Novation/Focusrite)
- Device Family: `0x48` (NOT `0x15` — that's the MK2)
- Firmware: `01.01.0B.39`

The old MK2 device ID `0x15` still works for DAW mode enter/exit commands, but NOT for LED or screen control via SysEx.

## DAW Mode

```
Enter:  F0 00 20 29 02 15 02 7F F7
Exit:   F0 00 20 29 02 15 02 00 F7
```

Device echoes back the same SysEx as confirmation.

## LED Control (CC-Based)

The MK3 does NOT use SysEx for LED control (unlike what the MK2 protocol suggests). LEDs are controlled via standard CC messages.

```
Channel 1 (0xB0): Solid color
Channel 2 (0xB1): Slow flash
Channel 3 (0xB2): Fast flash
Channel 4 (0xB3): Solid white (any value)
```

**Message format:** `B<channel-1> <cc_number> <palette_value>`

- `cc_number`: The CC index of the button/encoder (see mapping below)
- `palette_value`: 0-127 color palette index (0 = off)

### Button CC Map (DAW Mode)

| Physical Position | CC Number |
|-------------------|-----------|
| Bottom row buttons 1-8 | 37-44 |
| Bottom row buttons 9-16 | 45-52 |

### Encoder CC Map (DAW Mode)

| Row | Data CCs (absolute) | Data CCs (relative) | LED CCs |
|-----|---------------------|---------------------|---------|
| 1   | 13-20               | 77-84 (+64)         | 13-20   |
| 2   | 21-28               | 85-92 (+64)         | 21-28   |
| 3   | 29-36               | 93-100 (+64)        | 29-36   |

**Important:** LED CC numbers always use the BASE CC (13-36), never the relative-shifted values.

### Fader CCs

Faders 1-8: CC 77-84 on channel 16. Absolute values 0-127. No LEDs.

### 128-Color Palette

| Index | Color |
|-------|-------|
| 0 | Off |
| 1 | Dark grey |
| 2 | Mid grey |
| 3 | White |
| 4-7 | Red (light light → dark) |
| 8-11 | Orange (ll → dark) |
| 12-15 | Yellow (ll → dark) |
| 16-19 | Yellow-green (ll → dark) |
| 20-23 | Neon green (ll → dark) |
| 24-27 | Teal (ll → dark) |
| 28-31 | Teal variant |
| 32-35 | Deep teal |
| 36-39 | Bluish teal |
| 40-43 | Sky blue |
| 44-47 | Rich blue |
| 48-51 | Purple |
| 52-55 | Pink |
| 56-59 | Fuchsia |
| 60-63 | Red → yellow |
| 64-67 | Green → blue |
| 68-71 | Teal → purple → pink |
| 72-75 | Red → pale yellow → green |
| 76-79 | Green → teal → sky → lazuli |
| 80-83 | Purple → fuchsia → pink → dark orange |
| 84-87 | Orange → pale yellow → yellow → frog green |
| 88-91 | Lime → ice → frozen → pale purple |
| 92-95 | Dark pale purple → pink → fuchsia → rich fuchsia |
| 96-101 | Orange → yellow → yellow-green |
| 102-105 | Yellow → electric green → pale green → pale purple |
| 106-111 | Muted purple → peach → red → pink |
| 112-115 | Orange → light orange → pale yellow → yellow |
| 116-119 | Deep purple → skin → ice → pale purple |
| 120-123 | Pale purple → dim purple → grey → white |
| 124-127 | Red → dark red → green → dark green (+ yellow, orange variants) |

## Relative Encoder Mode

Enable per row via CC on **channel 7** (status byte `0xB6`):

```
Row 1 ON:  B6 45 7F    OFF: B6 45 00    (CC 69)
Row 2 ON:  B6 48 7F    OFF: B6 48 00    (CC 72)
Row 3 ON:  B6 49 7F    OFF: B6 49 00    (CC 73)
```

When relative mode is active, encoder data CCs shift by **+64 (0x40)**:
- Row 1: 13-20 → 77-84
- Row 2: 21-28 → 85-92
- Row 3: 29-36 → 93-100

Relative values center at 64. Values > 64 = clockwise, < 64 = counter-clockwise. Delta = value - 64.

## OLED Screen (SysEx)

The LCXL3 has a 3-row OLED display. Text is sent via SysEx.

**Note:** In DAW mode, the DAW overlay hides custom text. Text only becomes visible after pressing the Mode button (which clears the overlay). Continuous re-sending can maintain visibility.

### Step 1 — Configure Display

```
F0 00 20 29 02 15 04 35 02 F7
```

- `0x35`: screen target
- `0x02`: arrangement (3-row layout)

### Step 2 — Set Text Per Row

Each row requires a separate SysEx message:

```
F0 00 20 29 02 15 06 35 00 <top row ASCII bytes> F7     (field 0x00)
F0 00 20 29 02 15 06 35 01 <middle row ASCII bytes> F7  (field 0x01)
F0 00 20 29 02 15 06 35 02 <bottom row ASCII bytes> F7  (field 0x02)
```

### Step 3 — Trigger Display

Re-send the top row text WITHOUT the field byte:

```
F0 00 20 29 02 15 06 35 <top row ASCII bytes> F7
```

### Arrangement Options

| Arrangement | Row Layout |
|-------------|------------|
| 1 | Field 0 = middle (centered), field 1 = bottom |
| 2 | Field 0 = top, field 1 = middle, field 2 = bottom (**all 3 rows**) |
| 3 | Field 0 = top (centered), field 1 = middle (left-aligned) |
| 4 | Concatenates fields on top, stray "0" on bottom |

## Transport / Page Buttons

| Button | CC | Channel |
|--------|-----|---------|
| Page Up | 106 | 1 |
| Page Down | 107 | 1 |

Press sends val 127, release sends val 0.

## Port Names (Windows)

| Port | Purpose |
|------|---------|
| LCXL3 1 MIDI | Standalone port |
| MIDIIN2 (LCXL3 1 MIDI) | DAW input (receives button/encoder/fader data) |
| MIDIOUT2 (LCXL3 1 MIDI) | DAW output (sends LED, screen, mode commands) |
| MIDIOUT3/4 (LCXL3 1 MIDI) | Additional ports (purpose TBD) |

## Initialization Sequence

1. Open MIDIOUT2 (DAW output)
2. Open MIDIIN2 (DAW input)
3. Send DAW mode ON: `F0 00 20 29 02 15 02 7F F7`
4. Enable relative encoders: `B6 48 7F` (row 2), `B6 49 7F` (row 3)
5. Configure screen: `F0 00 20 29 02 15 04 35 02 F7`
6. Send screen text (3 field messages + trigger)
7. Send LED colors via CC on ch1

---

*Discovered and documented by Lucian Labs, March 2026. Built with midiwave.*
