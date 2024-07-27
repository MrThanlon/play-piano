<script setup lang="ts">
import { onBeforeMount } from 'vue'
import { start } from '../utils/midi'
import { WebAudioFontPlayer } from '@mrthanlon/webaudiofont'

console.log(WebAudioFontPlayer)

const ac = new AudioContext()
console.log(ac)
const player = new WebAudioFontPlayer()
player.loader.decodeAfterLoading(ac, '')

function startPlay() {
  
}

onBeforeMount(async () => {
  await start(event => {
    if (event.data && event.data[0] !== 0xe4) {
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
