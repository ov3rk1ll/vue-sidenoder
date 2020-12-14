<template>
  <div class="about">
    <h1>
      Vue Sideload <small class="text-muted">{{ version }}</small>
    </h1>
    <p class="lead">
      Based on
      <a href="https://github.com/whitewhidow/quest-sidenoder" target="_blank"
        >SideNoder</a
      >
      by WhiteWhidow
    </p>
    <p>
      To report a bug or issue, please click
      <a href="https://github.com/ov3rk1ll/vue-sidenoder/issues" target="_blank"
        >here</a
      >.
    </p>
    <p>
      Thanks to all the
      <a
        href="https://github.com/ov3rk1ll/vue-sidenoder/blob/main/CONTRIBUTORS.md"
        target="_blank"
        >contributors</a
      >
      to this app.
    </p>
  </div>
</template>

<script>
export default {
  name: "About",
  data: () => {
    return {
      version: process.env.PACKAGE_VERSION,
    };
  },
};
</script>
