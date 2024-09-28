<script setup lang="ts">
import { defineProps, ref, onMounted } from 'vue'

const canvas = ref<HTMLCanvasElement>()
let context: CanvasRenderingContext2D

const props = defineProps(['foo'])

console.log(props.foo)

function drawGroup(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.moveTo(x, y)
  ctx.lineTo(x, y + 30)
  ctx.lineTo(x + 3, y + 30)
  ctx.stroke()
}

onMounted(() => {
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d')
    if (ctx) {
      context = ctx
    }
    context.fillStyle = '#ffffffff'
    context.fillRect(0, 0, canvas.value.width, canvas.value.height)
    drawGroup(context, 0, 0)
  }
})

</script>

<template>
  <canvas ref="canvas" style="width: 100%; height: 100px;"></canvas>
</template>

<style scoped>

</style>