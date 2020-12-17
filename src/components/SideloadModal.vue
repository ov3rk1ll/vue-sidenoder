<template>
  <b-modal
    id="bv-modal-sideload"
    no-close-on-esc
    no-close-on-backdrop
    hide-header-close
    @shown="completed = false"
  >
    <template #modal-title>Working...</template>
    <div class="d-block">
      <b-list-group>
        <b-list-group-item
          v-for="item in items"
          v-show="item.show"
          :key="item.key"
          :variant="getStatusClass(item)"
        >
          <b-spinner small :class="{ invisible: !item.loading }"></b-spinner>
          {{ item.text }}</b-list-group-item
        >
      </b-list-group>
    </div>
    <template #modal-footer="{ close }">
      <div class="w-100">
        <b-button
          v-if="completed"
          variant="primary"
          size="sm"
          class="float-right"
          @click="close()"
        >
          Close
        </b-button>
      </div>
    </template>
  </b-modal>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "SideloadModal",
  data: function () {
    return {
      completed: false,
      success: false,
      items: [],
    };
  },
  methods: {
    getStatusClass(item) {
      if (!item.started) {
        return "default";
      } else {
        if (item.loading) {
          return "info";
        } else {
          if (item.status) {
            return "success";
          } else {
            return "danger";
          }
        }
      }
    },
  },
  created() {
    ipcRenderer.on("sideload_folder_progress", (e, args) => {
      this.items = args.items;
      if (args.done) {
        this.completed = true;
      }
    });
  },
};
</script>

<style scoped></style>
