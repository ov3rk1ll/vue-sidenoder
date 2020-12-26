<template>
  <div class="storage">
    <div class="mb-2">
      Jump to
      <b-button
        size="sm"
        v-for="item in quicklinks"
        :key="item.name"
        @click="open({ path: item.path, isDir: true })"
        class="ml-2"
        squared
        variant="outline-primary"
        :disabled="loading"
        >{{ item.name }}</b-button
      >
    </div>
    <h4>{{ folder }}</h4>
    <b-list-group>
      <b-list-group-item
        v-for="item in items"
        :key="item.name"
        class="d-flex"
        href="#"
        @click="open(item)"
        :disabled="loading"
      >
        <div class="flex-fill mr-4">
          <b-icon :icon="getIcon(item)" class="mr-2" />
          {{ item.name }}
        </div>
        <div>...</div>
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "Storage",
  data: () => {
    return {
      folder: null,
      items: [],
      loading: false,
      quicklinks: [
        {
          name: "Home",
          path: "/sdcard",
        },
        {
          name: "Screenshots",
          path: "/sdcard/Oculus/Screenshots",
        },
        {
          name: "Videos",
          path: "/sdcard/Oculus/VideoShots",
        },
      ],
    };
  },
  mounted: function () {
    this.$nextTick(function () {
      ipcRenderer.on("adb_dir", (e, args) => {
        this.items = args.value;
        this.loading = false;
      });

      ipcRenderer.on("adb_pull", (e, args) => {
        if (!args.canceled) {
          this.$toast.success("File was copied!", {
            pauseOnFocusLoss: false,
            pauseOnHover: true,
          });
        }
        this.loading = false;
      });

      this.open({ path: "/sdcard", isDir: true });
    });
  },
  methods: {
    open(item) {
      this.loading = true;
      if (item.isDir) {
        this.folder = item.path;
        ipcRenderer.send("adb_dir", { path: item.path });
      } else {
        ipcRenderer.send("adb_pull", {
          path: item.path,
          name: item.name,
        });
      }
    },
    getIcon(item) {
      if (item.name === "..") {
        return "arrow-90deg-up";
      }
      if (item.isDir) {
        return "folder";
      }

      if (item.mime === false) {
        return "file";
      } else if (item.mime.startsWith("image/")) {
        return "file-image";
      } else if (item.mime.startsWith("video/")) {
        return "file-play";
      } else if (
        item.mime === "application/json" ||
        item.mime === "text/plain"
      ) {
        return "file-text";
      } else if (item.mime === "application/vnd.android.package-archive") {
        return "file-richtext";
      } else if (item.mime === "application/zip") {
        return "file-zip";
      } else {
        return "file-x";
      }
    },
  },
};
</script>
