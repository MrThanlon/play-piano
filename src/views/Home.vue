<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { start } from '../utils/midi'
import { generate } from '../utils/osc'

const ac = new AudioContext()

let g: any = undefined

function startPlay() {
  // freqs
  const freq = 261.626
  const amp = [1, 0.3, 0.25, 0.2, 0.13, 0.1, 0.07, 0.05]
  if (!g) {
    g = generate(ac, freq, amp)
  }
  g.stop()
  g.play()
}

onBeforeMount(async () => {
  await start(event => {
    if (event.data) {
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
