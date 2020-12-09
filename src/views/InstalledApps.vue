<template>
  <div class="about">
    <h1>This is a list of installed apps</h1>
    <pre>{{ items }}</pre>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "InstalledApps",
  data: function() {
    return {
      items: [],
    };
  },
  mounted: function() {
    this.$nextTick(function() {
      ipcRenderer.on("get_installed_apps", (e, args) => {
        this.items = args.value;
        this.loading = false;
      });
      this.loading = true;
      ipcRenderer.send("get_installed_apps", null);
    });
  },
  methods: {},
};
</script>
