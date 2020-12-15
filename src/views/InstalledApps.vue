<template>
  <div>
    <CenterSpinner v-if="loading" />
    <div class="installed" v-if="!loading">
      <h1>
        <b-icon icon="cpu" /> Installed apps
        <small class="text-muted" v-if="!loading"
          >{{ items.length }} apps</small
        >
      </h1>
      <b-table striped hover :fields="fields" :items="items">
        <template #cell(flags)="data">
          {{ data.item.debug ? "DEBUG" : "" }}
          {{ data.item.system ? "SYSTEM" : "" }}
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="danger" @click="uninstall(data.item)"
            >Uninstall</b-button
          >
        </template>
      </b-table>
      <SideloadModal />
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "InstalledApps",
  data: function() {
    return {
      loading: false,
      fields: [
        "packageName",
        "versionCode",
        { key: "flags", label: "Flags" },
        { key: "actions", label: "" },
      ],
      items: [],
    };
  },
  mounted: function() {
    this.$nextTick(function() {
      ipcRenderer.on("sideload_folder_progress", (e, args) => {
        // Update list if sideload is args.done: true
        if (args.done && args.task === "uninstall") {
          this.items = this.items.filter(
            (x) => x.packageName !== args.packageName
          );
        }
      });

      ipcRenderer.on("get_installed_apps", (e, args) => {
        this.items = Object.values(args.value);
        this.loading = false;
      });
      this.loading = true;
      ipcRenderer.send("get_installed_apps", null);
    });
  },
  methods: {
    uninstall: function(item) {
      this.$bvModal
        .msgBoxConfirm("Uninstall " + item.packageName + "?", {
          title: "Uninstall " + item.packageName + "?",
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
              packageName: item.packageName,
            });
          }
        });
    },
  },
};
</script>

<style scoped>
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -5rem;
  margin-left: -5rem;
}
</style>
