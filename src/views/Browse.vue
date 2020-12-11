<template>
  <div>
    <div class="loading" v-if="loading">
      <b-spinner
        style="width: 5rem; height: 5rem;"
        label="Large Spinner"
      ></b-spinner>
    </div>
    <div class="browse" v-if="!loading">
      <div class="d-flex">
        <div class="flex-fill">
          <h1>
            Browse
            <small class="text-muted" v-if="!loading"
              >{{ filteredItems.length }} games</small
            >
          </h1>
        </div>
        <div>
          <b-button variant="outline-light" @click="reload()">Refresh</b-button>
        </div>
      </div>
      <b-input-group prepend="Search" class="mt-2 mb-4">
        <b-form-input
          placeholder="Search..."
          v-model="query"
          @keyup.enter="updateList()"
        ></b-form-input>
        <template #append>
          <b-button
            :disabled="query == ''"
            @click="
              query = '';
              updateList();
            "
            >Clear</b-button
          >
          <b-dropdown text="Filter" right>
            <b-dropdown-form>
              <b-form-checkbox-group
                v-model="filter"
                :options="filterOptions"
                stacked
              ></b-form-checkbox-group>
            </b-dropdown-form>
          </b-dropdown>
          <b-dropdown :text="sortName" right>
            <b-dropdown-item-button
              v-for="o in sortOptions"
              :key="o.text"
              :active="sort.key == o.value.key && sort.asc == o.value.asc"
              @click="
                sortName = o.text;
                sort = o.value;
              "
              >{{ o.text }}</b-dropdown-item-button
            >
          </b-dropdown>
        </template>
      </b-input-group>

      <h2 v-if="error">{{ error }}</h2>

      <b-row class="mx-0">
        <template v-for="item in filteredItems">
          <div
            v-bind:key="item.name"
            class="px-1 mb-2 col-12 col-md-4 col-lg-3 col-xl-2"
            v-bind:class="{
              'tag-installed': item.installedVersion != -1,
              'tag-update':
                item.installedVersion != -1 &&
                item.installedVersion < item.versionCode,
            }"
          >
            <Game :item="item" class="p-0" />
          </div>
        </template>
      </b-row>
    </div>
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
      loading: false,
      query: "",
      filter: ["uninstalled", "installed", "update"],
      filterOptions: [
        { text: "Show not-installed", value: "uninstalled" },
        { text: "Show installed", value: "installed" },
        { text: "Show updates", value: "update" },
      ],
      sort: { key: "name", asc: true },
      sortName: "Sort by name ↓",
      sortOptions: [
        { text: "Sort by name ↓", value: { key: "name", asc: true } },
        { text: "Sort by name ↑", value: { key: "name", asc: false } },
        { text: "Sort by update ↓", value: { key: "createdAt", asc: true } },
        { text: "Sort by update ↑", value: { key: "createdAt", asc: false } },
      ],
      error: null,
    };
  },
  mounted: function() {
    this.$nextTick(function() {
      ipcRenderer.on("ls_dir", (e, args) => {
        if (args.success) {
          this.error = null;
          this.items = args.value;
          this.updateList();
          this.loading = false;
        } else {
          this.error = args.error;
        }
      });

      this.loading = true;
      ipcRenderer.on("check_mount", this.onMountUpdate);
      ipcRenderer.send("check_mount", null);

      ipcRenderer.on("sideload_folder_progress", (e, args) => {
        if (args.done && args.success) {
          console.log("Browse", "sideload_folder_progress", args);
          if (args.task == "install") {
            this.items
              .filter((x) => x.packageName == args.packageName)
              .forEach((item) => {
                console.log(item.packageName, "was installed");
                item.installedVersion = item.versionCode;
              });
          } else if (args.task == "uninstall") {
            this.items
              .filter((x) => x.packageName == args.packageName)
              .forEach((item) => {
                console.log(item.packageName, "was uninstalled");
                item.installedVersion = -1;
              });
          }
          /*
          packageName: "com.idumpling.a_lullaby_of_colors"
          task: "uninstall"
          const target =
          // TODO: Update list if sideload is args.done: true
          */
        }
      });
    });
  },
  watch: {
    filter: function() {
      this.updateList();
    },
    sort: function() {
      this.updateList();
    },
  },
  methods: {
    onMountUpdate(e, args) {
      if (args.success) {
        ipcRenderer.removeListener("check_mount", this.onMountUpdate);
        this.reload();
      }
    },
    reload() {
      this.loading = true;
      ipcRenderer.send("ls_dir", { path: "/" });
    },
    updateList() {
      this.filteredItems = [];
      const newList = [];
      for (const item of this.items) {
        const isInstalled = item.installedVersion != -1;
        const hasUpdate =
          isInstalled && item.installedVersion < item.versionCode;

        let candiate = null;

        if (!isInstalled && this.filter.includes("uninstalled")) {
          candiate = item;
        } else if (isInstalled && this.filter.includes("installed")) {
          candiate = item;
        } else if (hasUpdate && this.filter.includes("update")) {
          candiate = item;
        }

        if (
          candiate &&
          this.query != "" &&
          !candiate.simpleName.toLowerCase().includes(this.query.toLowerCase())
        ) {
          candiate = null;
        }

        if (candiate != null) {
          newList.push(candiate);
        }
      }

      // Sort list
      this.filteredItems = newList.sort((a, b) => {
        var valA = a[this.sort.key];
        var valB = b[this.sort.key];
        if (valA < valB) {
          return this.sort.asc ? -1 : 1;
        }
        if (valA > valB) {
          return this.sort.asc ? 1 : -1;
        }
        return 0;
      });
    },
  },
};
</script>

<style>
.item {
  padding: 0;
}
.custom-control-label {
  white-space: nowrap;
}
</style>
