<script setup lang="ts">
import { defineProps, onMounted, watchEffect } from 'vue'

const props = defineProps<{
  fills: string[]
}>()
watchEffect(() => {
  console.log(props.fills)
})

const w = 1
const h = 10
const bh = 6
type Key = { color: string, points: number[], fill?: string }
const keys: Key[] = genKeys(2, 0, w, h, bh)
for (let i = 0; i < 7; i++) {
  keys.push(...genKeys(3, i * w * 12 + w * 3, w, h, bh))
  keys.push(...genKeys(4, i * w * 12 + w * 8, w, h, bh))
}
keys.push({
  color: 'white',
  points: [
    87 * w, 0,
    87 * w, h,
    88 + 0.75 * w, h,
    88 + 0.75 * w, 0,
  ]
})

onMounted(() => {
  
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
  <svg viewBox="0 0 88.75 10">
    <polygon
      v-for="(k, idx) in keys"
      :class="k.color"
      :style="{fill: props.fills[idx] || ''}"
      :points="k.points.toString()"
    ></polygon>
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
  stroke: black;
  stroke-width: 0.2%;
}
svg {
  width: 100%;
  background-color: white;
}
</style>