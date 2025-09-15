<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const Home = defineAsyncComponent(() => import("./views/Home.vue"));
</script>

<template>
  <Suspense>
    <Home></Home>
  </Suspense>
</template>

<style scoped></style>
