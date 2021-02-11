<template>
  <div class="about">
    <h1><b-icon icon="file-arrow-down" /> Sideload a local app</h1>
    <p class="lead">Install any app you have on your system</p>

    <h2>Sideload APK file</h2>
    <b-button variant="outline-primary" @click="sideloadApk"
      >Select file</b-button
    >
    <p class="rounded border my-2 p-2 bg-light text-dark">
      Use this function to sideload an app that consists of a single APK
      file.<br />For apps with additional OBB files, use the function below
      instead!
    </p>

    <h2>Sideload folder (APK + OBB files)</h2>
    <b-button variant="outline-primary" @click="sideloadFolder"
      >Select folder</b-button
    >
    <p class="rounded border my-2 p-2 bg-light text-dark">
      Use this function to sideload a folder containing an APK files and
      additional OBB files.<br />To install a single APK files, use the function
      above instead!
    </p>

    <SideloadModal />
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "Sideload",
  methods: {
    sideloadApk() {
      ipcRenderer.once("sideload_local_apk", (event, args) => {
        if (args.success) {
          this.$bvModal.show("bv-modal-sideload");
        } else {
          this.$bvModal.msgBoxOk(args.error, {
            title: "Error",
          });
        }
      });

      ipcRenderer.send("sideload_local_apk", null);
    },
    sideloadFolder() {
      ipcRenderer.once("sideload_local_folder", (event, args) => {
        if (args.success) {
          this.$bvModal.show("bv-modal-sideload");
        } else {
          this.$bvModal.msgBoxOk(args.error, {
            title: "Error",
          });
        }
      });

      ipcRenderer.send("sideload_local_folder", null);
    },
  },
};
</script>
