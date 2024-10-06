<script setup lang="ts">
import { onBeforeMount, ref, onMounted } from 'vue'
import { start } from '../utils/midi'
import { WebAudioFontPlayer } from '@mrthanlon/webaudiofont'
import { OpenSheetMusicDisplay, type Cursor } from 'opensheetmusicdisplay'
import Keyboard from '../components/Keyboard.vue'

// Sheet
const div = ref<HTMLElement>()
const input = ref<HTMLInputElement>()
let osmd: OpenSheetMusicDisplay
let cursor: Cursor

async function loadSheet(xml: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  try {
    await osmd.load(doc)
    osmd.Sheet.Instruments.forEach(instrument => {
      if (instrument.Name !== 'Piano') {
        instrument.Visible = false
      }
      instrument.NameLabel.print = false
    })
    osmd.render()
    cursor = osmd.cursor
    cursor.show()
    extractNotes()
  } catch (e) {
    console.log(doc)
    console.log(e)
    alert(e)
  }
}

onMounted(async () => {
  if (div.value) {
    osmd = new OpenSheetMusicDisplay(div.value, {
      backend: 'svg',
      drawTitle: true,
      followCursor: true,
    })
    const text = localStorage.getItem('sheet')
    if (text) {
      loadSheet(text)
    } else {
      // load default sheet
      const text = await import('../sheets/Mary_Had_a_Little_Lamb.musicxml?raw')
      loadSheet(text.default)
    }
    // for debug
    (window as any).osmd = osmd
  }
})

async function loadSheetFile(_event: Event) {
  if (!input.value) {
    return
  }
  if (!input.value.files) {
    return
  }
  const file = input.value.files[0]
  const text = await file.text()
  localStorage.setItem('sheet', text)
  loadSheet(text)
}

// Audio
const ac = new AudioContext()
const player = new WebAudioFontPlayer()
player.loader.decodeAfterLoading(ac, '_tone_0000_JCLive_sf2_file')
const instrumentKeys = ref(player.loader.instrumentKeys())

function getInstrumentTitle(idx: number) {
  return player.loader.instrumentInfo(idx).title
}

const instrumentIdx = ref(0)

let tone: any = (window as any)._tone_0000_JCLive_sf2_file

function selectInstrument() {
  const info = player.loader.instrumentInfo(instrumentIdx.value)
  console.log(info)
  player.loader.startLoad(ac, info.url, info.variable)
  player.loader.waitLoad(() => {
    console.log('done',info.variable)
    tone = window[info.variable]
    player.cancelQueue(ac)
    console.log(tone)
  })
}

// midi
const fills = ref<string[]>(Array(88).fill(''))
const fillColor = ref<(k: { key: number, color: string })=>{}>()
const expectedKeys = new Set<number>()
let expectedKeyPressed = 0
const colorExpected = '#0000FF'
const colorCorrect = '#00FF00'
const colorWrong = '#FF0000'
const midiNotes = new Map()

function extractNotes() {
  let flagRest = true
  expectedKeys.clear()
  fills.value.fill('')
  cursor.NotesUnderCursor().forEach(note => {
    console.log(note.halfTone)
    if (note.halfTone > 0) {
      const key = note.halfTone + 3
      expectedKeys.add(key)
      fills.value[key] = colorExpected
      console.log(`${key}: ${colorExpected}`)
      flagRest = false
    }
  })
  if (flagRest) {
    // go to next
    if (cursor.Iterator.EndReached) {
      cursor.reset()
      extractNotes()
    } else {
      cursor.next()
      extractNotes()
    }
  }
}

function midiNoteOn(pitch: number, velocity: number) {
  midiNoteOff(pitch)
  const envelope = player.queueWaveTable(ac, ac.destination, tone, 0, pitch, 123456789, velocity / 100)
  midiNotes.set(pitch, envelope)
}

function midiNoteOff(pitch: number) {
  midiNotes.get(pitch)?.cancel()
  midiNotes.delete(pitch)
}

function keyDown(pitch: number, velocity: number) {
  midiNoteOn(pitch, velocity)
  // keyboard display
  const key = pitch - 21
  if (expectedKeys.has(key)) {
    // correct
    expectedKeyPressed += 1
    if (expectedKeyPressed >= expectedKeys.size) {
      // move sheet cursor to next
      osmd.cursor.next()
      extractNotes()
      expectedKeyPressed = 0
    }
    fills.value[key] = colorCorrect
  } else {
    fills.value[key] = colorWrong
  }
}

function keyUp(pitch: number) {
  midiNoteOff(pitch)
  const key = pitch - 21
  if (expectedKeys.has(key)) {
    fills.value[key] = colorExpected
    expectedKeyPressed -= 1
  } else {
    fills.value[key] = ''
  }
}

function startPlay() {
  midiNoteOn(60, 20)
  midiNoteOff(60)
}

onBeforeMount(async () => {
  await start(({ data }) => {
    if (!data) {
      return
    }
    const type = data[0] & 0xf0
    if (type === 144) {
      keyDown(data[1], data[2])
    } else if (type === 128) {
      keyUp(data[1])
    }
    if (data && data[0] !== 0xe4) {
      // console.log(Array.from(data).map(v => v.toString(16)).join(' '))
      // console.log(`0x${data[0].toString(16)} 0x${data[1].toString(16)} 0x${data[2].toString(16)}`)
    }
  })
})

</script>

<template>
  <Keyboard :fills="fills" v-model="fillColor"></Keyboard>
  <button @click="osmd.cursor.previous(); extractNotes()">Prev</button>
  <button @click="osmd.cursor.reset(), extractNotes()">Reset</button>
  <button @click="osmd.cursor.next(); extractNotes()">Next</button>
  <div id="sheet-container" ref="div"></div>
  <select @change="selectInstrument" v-model="instrumentIdx">
    <option v-for="(_item, idx) in instrumentKeys" :value="idx">
      {{ getInstrumentTitle(idx) }}
    </option>
  </select>
  <button @click="startPlay">play</button>
  <input @change="loadSheetFile" ref="input" type="file" accept=".musicxml,.xml">
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
