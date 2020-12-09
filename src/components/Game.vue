<template>
  <b-card
    :title="item.simpleName"
    :img-src="item.imagePath"
    img-alt="Image"
    img-top
    tag="article"
    class="mx-1"
  >
    <b-card-text>{{ item.versionName }} ({{ item.versionCode }})</b-card-text>

    <b-button
      class="card-link"
      href="#"
      variant="success"
      v-on:click="open(item)"
      v-if="
        item.installedVersion != -1 && item.installedVersion < item.versionCode
      "
      :disabled="loading"
      ><b-spinner small v-if="loading"></b-spinner> Update</b-button
    >
    <b-button
      class="card-link"
      href="#"
      variant="default"
      v-on:click="open(item)"
      v-if="item.installedVersion != -1"
      :disabled="loading"
      ><b-spinner small v-if="loading"></b-spinner> Re-Install</b-button
    >
    <b-button
      class="card-link"
      href="#"
      variant="primary"
      v-on:click="open(item)"
      v-if="item.installedVersion == -1"
      :disabled="loading"
      ><b-spinner small v-if="loading"></b-spinner> Install</b-button
    >
    <b-button
      class="card-link"
      href="#"
      variant="warning"
      v-on:click="uninstall(item)"
      v-if="item.installedVersion != -1"
      :disabled="loading"
      ><b-spinner small v-if="loading"></b-spinner> Uninstall</b-button
    >
  </b-card>
</template>

<script>
const { ipcRenderer } = require("electron");
const { formatBytes } = require("@/utils/formatter");

export default {
  name: "Game",
  props: {
    item: Object,
  },
  data: () => {
    return {
      loading: false,
    };
  },
  methods: {
    open: function(item) {
      ipcRenderer.once("check_folder", (e, args) => {
        this.loading = false;

        if (args.success) {
          let message =
            "Download " +
            formatBytes(args.value.totalSize) +
            " and install " +
            args.value.apk.Name +
            "?";

          if (args.value.hasObb) {
            message += " Obb files will be downloaded!";
          }

          this.$bvModal
            .msgBoxConfirm(message, {
              title: "Install " + args.value.apk.Name + "?",
              size: "lg",
              buttonSize: "lg",
              okVariant: "primary",
              // headerClass: "p-2 border-bottom-0",
              // footerClass: "p-2 border-top-0",
              centered: true,
            })
            .then((value) => {
              if (value) {
                this.$bvModal.show("bv-modal-sideload");
                ipcRenderer.send("sideload_folder", {
                  data: args.value,
                  app: this.item,
                });
              }
            });
        }
      });
      this.loading = true;
      ipcRenderer.send("check_folder", { path: item.filePath });
    },
    uninstall: function(item) {
      this.$bvModal
        .msgBoxConfirm("Uninstall " + item.simpleName + "?", {
          title: "Uninstall " + item.simpleName + "?",
          size: "lg",
          buttonSize: "lg",
          okVariant: "danger",
          // headerClass: "p-2 border-bottom-0",
          // footerClass: "p-2 border-top-0",
          centered: true,
        })
        .then((value) => {
          if (value) {
            this.$bvModal.show("bv-modal-sideload");
            ipcRenderer.send("uninstall_app", {
              packageName: this.item.packageName,
            });
          }
        });
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.card-body {
  padding: 0.5rem 0.5rem 1.25rem 0.5rem;
}
.card-title {
  margin-bottom: 0.25rem;
}
.card-link + .card-link {
  margin-left: 1.25rem;
}
.card-text {
  margin-bottom: 0.5rem;
}
</style>
