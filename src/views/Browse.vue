<template>
  <div class="home">
    <h1>Browse <b-spinner v-if="loading"></b-spinner></h1>

    <b-form-group label="Filter list">
      <b-form-checkbox-group
        id="checkbox-group-1"
        v-model="filter"
        :options="options"
        name="flavour-1"
      ></b-form-checkbox-group>
    </b-form-group>

    <b-row>
      <div
        class="mb-2 col-12 col-md-4 col-lg-3 item"
        v-for="item in filteredItems"
        :key="item.name"
        v-bind:class="{
          'tag-installed': item.installedVersion != -1,
          'tag-update':
            item.installedVersion != -1 &&
            item.installedVersion < item.versionCode,
        }"
      >
        <Game :item="item" />
      </div>
    </b-row>
    <SideloadModal />
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "Browse",
  data: function() {
    return {
      items: [],
      filteredItems: [],
      filter: ["uninstalled", "installed", "update"],
      loading: false,
      options: [
        { text: "Show not-installed", value: "uninstalled" },
        { text: "Show installed", value: "installed" },
        { text: "Show updates", value: "update" },
      ],
    };
  },
  mounted: function() {
    this.$nextTick(function() {
      ipcRenderer.on("check_device", (e, args) => {
        console.log("Browse: check_device", args);
      });
      ipcRenderer.on("ls_dir", (e, args) => {
        console.log(args);
        this.items = args.value;
        this.filterList();
        this.loading = false;
      });

      // TODO: check mount first
      this.loading = true;
      ipcRenderer.send("ls_dir", { path: "/" });

      ipcRenderer.on("sideload_folder_progress", (e, args) => {
        console.log("Browse", "sideload_folder_progress", args);
        // TODO: Update list if sideload is args.done: true
      });
    });
  },
  watch: {
    filter: function() {
      this.filterList();
    },
  },
  methods: {
    filterList() {
      this.filteredItems = [];
      for (const item of this.items) {
        const isInstalled = item.installedVersion != -1;
        const hasUpdate =
          isInstalled && item.installedVersion < item.versionCode;

        if (!isInstalled && this.filter.includes("uninstalled")) {
          this.filteredItems.push(item);
          continue;
        }

        if (isInstalled && this.filter.includes("installed")) {
          this.filteredItems.push(item);
          continue;
        }

        if (hasUpdate && this.filter.includes("update")) {
          this.filteredItems.push(item);
          continue;
        }
      }
    },
  },
};
</script>

<style>
.item {
  padding: 0;
}
</style>
