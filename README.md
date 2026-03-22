# midiwave

Browser-based MIDI device workbench for discovering, testing, and configuring MIDI controllers. Built for the Novation Launch Control XL MK3 but works with any MIDI device.

## Why

The LCXL3's DAW mode protocol (LED colors, OLED screen, relative encoders) is underdocumented. This tool lets you poke at the hardware live — change LED colors, write text to the screen, monitor incoming CCs, and export working configs for your apps.

## Run

```bash
node server.js
# open http://localhost:3000
```

Or just open `index.html` directly in Chrome/Edge (Web MIDI requires HTTPS or localhost).

## What It Does

- **MIDI Monitor** — live scrolling log of all incoming messages with CC/Note/SysEx filtering and Learn mode
- **LED Control** — 128-color palette picker for buttons and encoders via CC on ch1
- **OLED Screen Writer** — 3-row text display via SysEx (arrangement 2, fields 0x00-0x02)
- **CC Sender** — manual CC output with live slider mode
- **SysEx Workbench** — raw hex input with LCXL3 presets
- **Pages** — save/recall LED + screen + encoder configurations, bound to hardware page up/down (CC 106/107)
- **Sparkle** — LED light show + scrolling screen text for the gram
- **Config Export** — JSON snapshot of your entire setup for use in other apps

## LCXL3 MK3 Protocol (Discovered)

Things we reverse-engineered that aren't in any docs:

| Feature | Method | Details |
|---------|--------|---------|
| LED colors | CC on ch1 | `B0 <cc> <palette 0-127>`, ch2=slow flash, ch3=fast flash |
| Encoder LEDs | CC on ch1 | Same as buttons, CC 13-36 |
| OLED screen | SysEx | Config arr=2, then fields 0x00/0x01/0x02 for top/mid/bot |
| Relative mode | CC on ch7 | CC 69/72/73 = row 1/2/3, shifts data CCs by +64 |
| DAW mode | SysEx | `F0 00 20 29 02 15 02 7F F7` (on) / `...00 F7` (off) |
| Page up/down | CC on ch1 | CC 106 = up, CC 107 = down |
| Device family | Identity | 0x48 (not 0x15 as assumed from MK2) |

### Encoder CCs (DAW Mode)

| Row | Absolute | Relative (+64) | LED |
|-----|----------|-----------------|-----|
| 1   | 13-20    | 77-84           | 13-20 on ch1 |
| 2   | 21-28    | 85-92           | 21-28 on ch1 |
| 3   | 29-36    | 93-100          | 29-36 on ch1 |

### Color Palette (128 indexed colors)

| Range | Colors |
|-------|--------|
| 0 | Off |
| 1-3 | Grey ramp → white |
| 4-7 | Red (light→dark) |
| 8-11 | Orange |
| 12-15 | Yellow |
| 16-19 | Yellow-green |
| 20-23 | Neon green |
| 24-39 | Teals |
| 40-47 | Sky blue → rich blue |
| 48-55 | Purple → pink |
| 56-59 | Fuscia |
| 60-127 | Mixed/compound colors |

## Stack

- Single `index.html` — inline CSS + JS, no build step, no dependencies
- Web MIDI API (`sysex: true`)
- Optional `server.js` for terminal logging via POST `/log`
- Chrome or Edge (Firefox doesn't support Web MIDI)

## License

MIT
