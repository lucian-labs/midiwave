# midiwave Device Profile Schema

Device profiles are JSON files that tell midiwave how to communicate with a specific MIDI controller. Each profile defines the hardware layout, LED control method, screen protocol, and color palette.

## File Location

```
devices/
├── SCHEMA.md       # this file
├── lcxl3.json      # Novation Launch Control XL MK3
├── minilab3.json   # Arturia MiniLab 3
└── ...             # add more as discovered
```

## Required Fields

```jsonc
{
  "name": "Human-readable device name",
  "id": "kebab-case-id",
  "manufacturer": "Manufacturer name",

  // MIDI identity (from F0 7E 7F 06 01 F7 probe)
  "identity": {
    "manufacturer_id": "00 20 29",       // hex bytes
    "family": "0x48",                     // device family byte
    "sysex_header": [240, 0, 32, 41, 2, 21]  // decimal, used for all SysEx
  },

  // Substring matches for auto-detecting MIDI port names
  "port_match": ["LCXL3", "Launch Control XL"],

  // LED control method — how to set LED colors
  "led": {
    "method": "cc_channel | sysex_rgb | noteon_velocity | none",

    // For cc_channel: send CC on this channel, value = palette index
    "channel": 1,
    "palette_size": 128,
    "flash_channels": { "solid": 1, "slow_flash": 2, "fast_flash": 3 },
    "off_value": 0,

    // For sysex_rgb: SysEx template with placeholders
    // "template": [240, ..., "{cc}", "{r}", "{g}", "{b}", 247],

    // For noteon_velocity: NoteOn where velocity = color
    // "channel": 10, "note_offset": 0
  },

  // Screen/display control (null if no screen)
  "screen": null,
  // OR:
  // "screen": {
  //   "method": "sysex_fields | cc_value | none",
  //   "target": 53,  // SysEx target byte
  //   ...
  // },

  // Physical layout — what controls exist and their CC assignments
  "layout": {
    "encoders": {
      "row1": { "ccs": [1,2,3,4,5,6,7,8], "channel": 1, "has_led": false }
    },
    "faders": { "ccs": [9,10,11,12], "channel": 1, "has_led": false },
    "pads": {
      "row1": { "ccs": [36,37,38,39], "channel": 10, "has_led": true, "type": "note" }
    },
    "buttons": {
      "row1": { "ccs": [41,42,43,44], "channel": 1, "has_led": true }
    },
    "transport": {},
    "keyboard": { "range": [48, 72], "channel": 1 }
  },

  // Relative encoder config (null if not supported)
  "relative_encoders": null,

  // Color palette CSS hex values (null if no LEDs or unknown)
  "color_palette": null,

  // Human notes about quirks, discoveries, limitations
  "notes": "",

  "_midiwave_version": "1.0"
}
```

## LED Methods

### `cc_channel`
Most Novation devices. Send CC on a specific channel where CC number = control index and value = color palette index.
```
B0 <cc> <palette_value>   // channel 1
```

### `sysex_rgb`
Direct RGB control via SysEx. Some devices support this (e.g., Launchpad Pro).
```
F0 ... 01 <cc> <R> <G> <B> F7
```

### `noteon_velocity`
Pad-based devices (e.g., Akai, some Arturia). NoteOn where velocity = color index.
```
9x <note> <velocity>
```

### `none`
Device has no programmable LEDs.

## Discovery Workflow

When adding a new device:

1. Connect the device and select its MIDI ports
2. Send identity request: `F0 7E 7F 06 01 F7`
3. Log the response to get manufacturer ID and family
4. Manually move every control and log CCs to build the layout
5. Try LED methods (CC on ch1-16, NoteOn, SysEx) to find what works
6. Document findings in a new JSON file
7. Submit as PR or save locally

## For AI Agents

When a user says "add support for [device]":

1. **Search** for the device's MIDI programmer's reference / implementation chart
2. **Create** a JSON file in `devices/` following this schema
3. **Fill in** what you can from docs (layout, identity, LED method)
4. **Mark unknowns** with `null` or `"unknown"` — the user will discover them with midiwave's probe tools
5. **Test** by loading the profile and using Learn All + Discovery mode
