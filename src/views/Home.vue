<script setup lang="ts">
import { onBeforeMount, ref, onMounted } from 'vue'
import { start } from '../utils/midi'
import { WebAudioFontPlayer } from '@mrthanlon/webaudiofont'
import { Staff as S } from '../utils/staff'

const div = ref<HTMLElement>()
const staff = new S(600, 400)

onMounted(() => {
  if (div.value)
    staff.mount(div.value)
})

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

const midiNotes = new Map()

function midiNoteOn(pitch: number, velocity: number) {
  midiNoteOff(pitch);
  const envelope = player.queueWaveTable(ac, ac.destination, tone, 0, pitch, 123456789, velocity / 100)
  midiNotes.set(pitch, envelope)
}

function midiNoteOff(pitch: number) {
  midiNotes.get(pitch)?.cancel()
  midiNotes.delete(pitch)
}

function startPlay() {
  midiNoteOn(60, 20)
}

function loadStaff(event: Event) {
  const file = (event.target as any).files[0]
  staff.loadMSCX(file)
}

onBeforeMount(async () => {
  await start(({ data }) => {
    if (!data) {
      return
    }
    const type = data[0] & 0xf0
    if (type === 144) {
      midiNoteOn(data[1], data[2])
    } else if (type === 128) {
      midiNoteOff(data[1])
    }
    if (data && data[0] !== 0xe4) {
      console.log(Array.from(data).map(v => v.toString(16)).join(' '))
      // console.log(`0x${data[0].toString(16)} 0x${data[1].toString(16)} 0x${data[2].toString(16)}`)
    }
  })
})

</script>

<template>
  <div ref="div"></div>
  <select @change="selectInstrument" v-model="instrumentIdx">
    <option v-for="(_item, idx) in instrumentKeys" :value="idx">
      {{ getInstrumentTitle(idx) }}
    </option>
  </select>
  <button @click="startPlay">play</button>
  <input @change="loadStaff" type="file">
</template>

<style scoped>
</style>
