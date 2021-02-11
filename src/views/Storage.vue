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

      <b-button
        size="sm"
        squared
        variant="primary"
        class="float-right"
        @click="upload()"
        >Upload file to current folder</b-button
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
        <div>{{ getExtraInfo(item) }}</div>
        <div>
          <b-button
            size="sm"
            variant="secondary"
            class="ml-3 p-1 my-0"
            v-if="!item.isDir"
          >
            <b-icon
              icon="trash"
              aria-label="Help"
              @click="remove(item, $event)"
            ></b-icon>
          </b-button>
        </div>
      </b-list-group-item>
    </b-list-group>

    <b-modal id="bv-modal-file-preview" size="xl">
      <template #modal-title>{{ previewFile.name }} </template>
      <div class="d-block text-center">
        <img :src="'temp://' + previewFile.preview" style="max-width: 100%" />
      </div>
      <template #modal-footer>
        <b-button class="mt-3" @click="open(previewFile, true)"
          >Save</b-button
        ></template
      >
    </b-modal>
  </div>
</template>

<script>
import { formatBytes } from "../utils/formatter";
const { ipcRenderer } = require("electron");

export default {
  name: "Storage",
  data: () => {
    return {
      folder: null,
      items: [],
      loading: false,
      previewFile: { name: null, preview: null },
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
          if (args.temp) {
            this.previewFile.preview = args.dst;
            this.$bvModal.show("bv-modal-file-preview");
          } else {
            this.$toast.success("File was copied!", {
              pauseOnFocusLoss: false,
              pauseOnHover: true,
            });
          }
        }
        this.loading = false;
      });

      ipcRenderer.on("adb_push", (e, args) => {
        if (!args.canceled) {
          this.$toast.success("File was copied to device!", {
            pauseOnFocusLoss: false,
            pauseOnHover: true,
          });
          ipcRenderer.send("adb_dir", { path: this.folder });
        }
        this.loading = false;
      });

      ipcRenderer.on("adb_remove", (e, args) => {
        if (!args.canceled) {
          this.$toast.success("File was removed!", {
            pauseOnFocusLoss: false,
            pauseOnHover: true,
          });

          ipcRenderer.send("adb_dir", { path: this.folder });
        }
        this.loading = false;
      });

      this.open({ path: "/sdcard", isDir: true });
    });
  },
  methods: {
    open(item, noPreview = false) {
      this.loading = true;
      if (item.isDir) {
        this.folder = item.path;
        ipcRenderer.send("adb_dir", { path: item.path });
      } else {
        delete item.temp;
        this.$bvModal.hide("bv-modal-file-preview");
        if (item.mime.startsWith("image/") && !noPreview) {
          // preview image in dialog
          this.previewFile = Object.assign({}, item, { preview: null });
          ipcRenderer.send("adb_pull", {
            path: item.path,
            name: item.name,
            temp: true,
          });
        } else {
          ipcRenderer.send("adb_pull", {
            path: item.path,
            name: item.name,
          });
        }
      }
    },
    upload() {
      ipcRenderer.send("adb_push", { folder: this.folder });
      this.loading = true;
    },
    remove(item, event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      ipcRenderer.send("adb_remove", { file: item.path });
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
    getExtraInfo(item) {
      if (item.isDir) {
        return "";
      }
      return formatBytes(item.size) + " | " + item.mtime.toLocaleDateString();
    },
  },
};
</script>
