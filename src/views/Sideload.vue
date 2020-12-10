<template>
  <div class="about">
    <h1>Sideload a local app</h1>
    <p class="lead">
      Install any app you have on your system
    </p>

    <h2>Sideload APK file</h2>
    <input
      type="file"
      ref="apkfile"
      style="display: none"
      accept=".apk"
      @change="onApkSelected($event)"
    />
    <b-button variant="outline-primary" @click="$refs.apkfile.click()"
      >Select file</b-button
    >
    <p class="rounded border my-2 p-2 bg-light text-dark">Info about apk</p>

    <h2>Sideload folder (APK + OBB files)</h2>
    <input
      type="file"
      ref="folder"
      style="display: none"
      webkitdirectory
      directory
    />
    <b-button variant="outline-primary" @click="$refs.folder.click()"
      >Select folder</b-button
    >
    <p class="rounded border my-2 p-2 bg-light text-dark">Info about folder</p>

    <SideloadModal />
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "Sideload",
  methods: {
    onApkSelected($event) {
      const files = $event.target.files;
      if (
        files == null ||
        files.length !== 1 ||
        files[0].type !== "application/vnd.android.package-archive"
      ) {
        this.$bvModal.msgBoxOk("Please select a single APK file!", {
          title: "Error",
        });
        return;
      }

      this.$bvModal.show("bv-modal-sideload");
      ipcRenderer.send("sideload_local_apk", {
        path: files[0].path,
      });

      this.$refs.apkfile.value = "";
    },
  },
};
</script>
