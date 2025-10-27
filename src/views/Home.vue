<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { WebAudioFontPlayer } from "@mrthanlon/webaudiofont";
import { OpenSheetMusicDisplay, type Cursor } from "opensheetmusicdisplay";
import Prompter from "../components/Prompter.vue";
import { useKeyboard } from "../utils/keyboard";

// Sheet
const storeEnableLeftHand = localStorage.getItem("enableLeftHand");
const storeEnableRightHand = localStorage.getItem("enableRightHand");
const enableLeftHand = ref(
  storeEnableLeftHand !== null ? storeEnableLeftHand === "1" : true
);
const enableRightHand = ref(
  storeEnableRightHand !== null ? storeEnableRightHand === "1" : true
);
const div = ref<HTMLElement>();
const input = ref<HTMLInputElement>();
let osmd: OpenSheetMusicDisplay;
let cursor: Cursor;

const builtinSheets = {
  "Frère Jacques": "sheets/Frre_Jacques.musicxml",
  "Mary Had a Little Lamb": "sheets/Mary_Had_a_Little_Lamb.musicxml",
  "Re Aoharu": "sheets/Blue_Archive_Nor_-_Re_Aoharu.musicxml",
  "Date - Radwimps": "sheets/Radwimps - Date.musicxml",
  "That Girl - Olly Murs": "sheets/That_Girl_Olly_Murs.musicxml",
};
const selectedSheet = ref(builtinSheets["Frère Jacques"]);

async function loadSheet(xml: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  try {
    await osmd.load(doc);
    osmd.Sheet.Instruments.forEach((instrument) => {
      if (instrument.PartAbbreviation !== "Pno.") {
        instrument.Visible = false;
      }
      instrument.NameLabel.print = false;
    });
    osmd.render();
    cursor = osmd.cursor;
    cursor.show();
    extractNotes();
    localStorage.setItem("sheet", xml);
  } catch (e) {
    console.log(doc);
    console.log(e);
    alert(e);
  }
}

onMounted(async () => {
  if (div.value) {
    osmd = new OpenSheetMusicDisplay(div.value, {
      // backend: "svg",
      drawTitle: true,
      followCursor: true,
    });
    const text = localStorage.getItem("sheet");
    if (text) {
      selectedSheet.value = "";
      loadSheet(text);
    } else {
      // load default sheet
      const text = await (
        await fetch(location.href + selectedSheet.value)
      ).text();
      loadSheet(text);
    }
    // for debug
    (window as any).osmd = osmd;
  }
});

async function loadSheetFile(_event: Event) {
  if (!input.value) {
    return;
  }
  if (!input.value.files) {
    return;
  }
  const file = input.value.files[0];
  let musicxml: string;
  // if (file.name.endsWith(".mid") || file.name.endsWith(".midi")) {
  //   const midi = new Midi(await file.arrayBuffer());
  //   const score = new music21.stream.Score();
  //   for (const track of midi.tracks) {
  //     const part = new music21.stream.Part();
  //     for (const note of track.notes) {
  //       const m21Note = new music21.note.Note(note.name);
  //       m21Note.quarterLength = note.duration;
  //       part.append(m21Note);
  //     }
  //     score.append(part);
  //   }
  //   const exporter = new music21.musicxml.m21ToXml.GeneralObjectExporter(score);
  //   musicxml = exporter.parse();
  // } else {
  musicxml = await file.text();
  // }
  loadSheet(musicxml);
}

// Audio
const ac = new AudioContext();
const player = new WebAudioFontPlayer();
player.loader.decodeAfterLoading(ac, "_tone_0000_JCLive_sf2_file");
const instrumentKeys = ref(player.loader.instrumentKeys());

function getInstrumentTitle(idx: number) {
  return player.loader.instrumentInfo(idx).title;
}

const instrumentIdx = ref(0);

let tone: any = (window as any)._tone_0000_JCLive_sf2_file;

function selectInstrument() {
  const info = player.loader.instrumentInfo(instrumentIdx.value);
  console.log(info);
  player.loader.startLoad(ac, info.url, info.variable);
  player.loader.waitLoad(() => {
    console.log("done", info.variable);
    tone = window[info.variable];
    player.cancelQueue(ac);
    console.log(tone);
  });
}

async function selectSheet() {
  const text = await (await fetch(location.href + selectedSheet.value)).text();
  loadSheet(text);
}

watch(enableLeftHand, (value) => {
  if (!value && !enableRightHand.value) {
    // at least one hand should be enabled
    enableRightHand.value = true;
  }
  localStorage.setItem("enableLeftHand", value ? "1" : "0");
  extractNotes();
});

watch(enableRightHand, (value) => {
  if (!value && !enableLeftHand.value) {
    enableLeftHand.value = true;
  }
  localStorage.setItem("enableRightHand", value ? "1" : "0");
  extractNotes();
});

// Keyboard
const fills = ref<string[]>(Array(88).fill(""));
const EXPECTED = "#0000FF";
const CORRECT = "#00FF00";
const WRONG = "#FF0000";

const keyboard = await useKeyboard(
  (pitch, velocity, correct) => {
    midiNoteOn(pitch, velocity);
    fills.value[pitch - 21] = correct ? CORRECT : WRONG;
  },
  (pitch, expected) => {
    midiNoteOff(pitch);
    fills.value[pitch - 21] = expected ? EXPECTED : "";
  },
  moveNext
);

let expected: { pitch: number; length: number }[] = [];
let autoplayed: { pitch: number; length: number }[] = [];
function extractNotes() {
  let s = "";
  expected = [];
  autoplayed = [];
  cursor.NotesUnderCursor().forEach((note) => {
    if (note.halfTone > 0) {
      const pitch = note.halfTone + 12;
      // TODO: get BPM
      const length = note.Length.RealValue;
      // hand
      if (note.ParentStaff.Id === 1) {
        // right hand
        if (enableRightHand.value) {
          expected.push({ pitch, length });
        } else {
          autoplayed.push({ pitch, length });
        }
      } else if (note.ParentStaff.Id === 2) {
        // left hand
        if (enableLeftHand.value) {
          expected.push({ pitch, length });
        } else {
          autoplayed.push({ pitch, length });
        }
      } else {
        // ???
        console.warn("unknown notes");
      }
      s += pitch + " ";
    }
  });
  if (expected.length === 0) {
    // go to next
    if (cursor.Iterator.EndReached) {
      cursor = osmd.cursor;
      cursor.reset();
      extractNotes();
    } else {
      cursor.next();
      extractNotes();
    }
  } else {
    if ((window as any).DEBUG) console.log(s);
  }
  fills.value.forEach((current, index) => {
    if (current !== WRONG) {
      if (expected.find((note) => note.pitch === index + 21) !== undefined) {
        fills.value[index] = EXPECTED;
      } else {
        fills.value[index] = "";
      }
    }
  });
  keyboard.setValue(expected, autoplayed);
}

const midiNotes = new Map();

function midiNoteOn(pitch: number, velocity: number) {
  midiNoteOff(pitch);
  const envelope = player.queueWaveTable(
    ac,
    ac.destination,
    tone,
    0,
    pitch,
    123456789,
    velocity / 100
  );
  midiNotes.set(pitch, envelope);
}

function midiNoteOff(pitch: number) {
  midiNotes.get(pitch)?.cancel();
  midiNotes.delete(pitch);
}

function moveNext(trigNotes?: boolean) {
  if (trigNotes) {
    [...expected, ...autoplayed].forEach(({ pitch, length }) => {
      midiNoteOn(pitch, 30);
      setTimeout(() => {
        midiNoteOff(pitch);
      }, length * 1000);
    });
  }
  osmd.cursor.next();
  extractNotes();
}

function movePrev() {
  osmd.cursor.previous();
  extractNotes();
}

function reset() {
  osmd.cursor.reset();
  extractNotes();
}

function startPlay() {
  midiNoteOn(60, 20);
  midiNoteOff(60);
}
</script>

<template>
  <Prompter :fills="fills"></Prompter>
  <label>
    <input type="checkbox" v-model="enableLeftHand" />
    Left Hand
  </label>
  <button @click="movePrev()">Prev</button>
  <button @click="reset()">Reset</button>
  <button @click="moveNext(true)">Next</button>
  <label>
    <input type="checkbox" v-model="enableRightHand" />
    Right Hand
  </label>
  <div id="sheet-container" ref="div"></div>
  <div
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      margin-top: 10px;
    "
  >
    <select @change="selectInstrument" v-model="instrumentIdx">
      <option v-for="(_item, idx) in instrumentKeys" :value="idx">
        {{ getInstrumentTitle(idx) }}
      </option>
    </select>
    <button @click="startPlay">play</button>
    <input
      @change="loadSheetFile"
      ref="input"
      type="file"
      accept=".musicxml,.xml"
    />
    <select @change="selectSheet" v-model="selectedSheet">
      <option v-for="(sheet, key) in builtinSheets" :value="sheet">
        {{ key }}
      </option>
    </select>
    <a href="https://github.com/MrThanlon/play-piano" target="_blank">About</a>
  </div>
</template>

<style scoped>
#sheet-container {
  background-color: white;
  width: 100%;
  height: 70vh;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
