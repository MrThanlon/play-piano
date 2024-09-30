<script setup lang="ts">
import { defineProps, ref, onMounted } from 'vue'

const props = defineProps([])

const w = 1
type Key = { color: 'white' | 'black', points: number[]}
const k: Key[] = genKeys(2)
for (let i = 0; i < 7; i++) {
  k.push(...genKeys(3, i * w * 12 + w * 3))
  k.push(...genKeys(4, i * w * 12 + w * 8))
}
k.push(...genKeys(1, w * 87))
const keys = ref<Key[]>(k)

onMounted(() => {
  console.log(props)
})

function genKeys(white: number, offset: number = 0, w: number = 1, h: number = 10, bh: number = 6): Key[] {
  const total = white * 2 - 1
  return Array(total).fill(0).map((_, idx) => {
    const points: number[] = []
    if (idx & 1) {
      // black
      points.push(
        offset + w * idx, 0,
        offset + w * idx, bh,
        offset + w * idx + w, bh,
        offset + w * idx + w, 0,
      )
    } else {
      // white
      const bi = idx / 2
      const left = w * total / white * bi
      const right = w * total / white * (bi + 1)
      points.push(
        offset + w * idx, 0,
        offset + w * idx, bh,
        offset + left, bh,
        offset + left, h,
        offset + right, h,
        offset + right, bh,
        offset + w * idx + w, bh,
        offset + w * idx + w, 0
      )
    }
    return {
      color: (idx & 1) ? 'black' : 'white',
      points
    }
  })
}

</script>

<template>
  <svg viewBox="0 0 88 10">
    <polygon v-for="k in keys" :class="k.color" :points="k.points.toString()"></polygon>
  </svg>
</template>

<style scoped>
.white {
  fill: white;
  stroke: black;
  stroke-width: 0.2%;
}
.black {
  fill: black;
}
svg {
  width: 100%;
  background-color: white;
}
</style>