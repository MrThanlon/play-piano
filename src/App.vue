<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const Home = defineAsyncComponent(() =>
  import('./views/Home.vue')
)

</script>

<template>
  <Home></Home>
</template>

<style scoped>
</style>
