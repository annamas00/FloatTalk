<template>
  <div class="auth-layout">
    <RouterView />
  </div>
</template>

<style scoped>
.auth-layout {
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom right, #eef2ff, #ffffff);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  isolation: isolate;
}
</style>