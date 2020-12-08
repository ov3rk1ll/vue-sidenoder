<template>
  <b-modal id="bv-modal-sideload" hide-footer>
    <template #modal-title>Installing...</template>
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
  </b-modal>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "SideloadModal",
  data: function() {
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
      // TODO: Show close button if sideload is args.done: true
    });
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped></style>
