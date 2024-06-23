<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { start, frequencies } from '../utils/midi'

type Tune = {
  oscillator: OscillatorNode,
  gain: GainNode,
  timer: number
}

const ac = new AudioContext()
const tunes = new Map<number, Tune>()
function startPlay() {
  for (let i = 0; i < frequencies.length; i++) {
    const gain = ac.createGain()
    gain.gain.value = 0
    gain.connect(ac.destination)
    const oscillator = ac.createOscillator()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequencies[i]
    oscillator.connect(gain)
    oscillator.start()
    tunes.set(i, {
      gain, oscillator, timer: 0
    })
  }
}

onBeforeMount(async () => {
  await start(event => {
    if (event.data) {
      if (event.data[0] === 0x94) {
        // start
        const tune = tunes.get(event.data[1] - 0x24 + 24)
        if (tune) {
          if (tune.timer !== 0) {
            clearInterval(tune.timer)
          }
          tune.gain.gain.value = 1
          tune.timer = setInterval(() => {
            tune.gain.gain.value *= 0.92
          }, 20)
        }
      } else if (event.data[0] === 0x84) {
        // stop
        const tune = tunes.get(event.data[1] - 0x24 + 24)
        if (tune) {
          clearInterval(tune.timer)
          tune.timer = setInterval(() => {
            tune.gain.gain.value *= 0.8
          }, 20)
        }
      }
      console.log(`0x${event.data[0].toString(16)} 0x${event.data[1].toString(16)} 0x${event.data[2].toString(16)}`)
    }
  })
})

</script>

<template>
  <button @click="startPlay">play</button>
</template>

<style scoped>
</style>
