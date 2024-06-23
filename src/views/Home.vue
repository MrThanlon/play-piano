<script setup lang="ts">
import { ref, onBeforeMount } from 'vue'
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

function play(frequency: number): Tune {
  const gain = ac.createGain()
  gain.gain.value = 1
  gain.connect(ac.destination) 
  const oscillator = ac.createOscillator()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency // 不能直接给frequency负值，可以设置其value
  // oscillator.frequency.exponentialRampToValueAtTime(440, 1) // 也可以通过它提供的方法来设置
  oscillator.connect(gain)
  oscillator.start()
  const timer = setInterval(() => {
    gain.gain.value *= 0.99
  })
  return {
    oscillator, gain, timer
  }
}

</script>

<template>
  <button @click="startPlay">play</button>
</template>

<style scoped>
</style>
