<template>
  <div>
    <h2>
      System check - <span v-if="!completed">Running...</span>
      <span v-if="completed && success">Successful!</span>
      <span v-if="completed && !success">Failed!</span>
    </h2>
    <b-list-group>
      <b-list-group-item
        v-for="item in items"
        :key="item.key"
        :variant="item.loading ? 'default' : item.status ? 'success' : 'danger'"
      >
        <b-spinner small :class="{ invisible: !item.loading }"></b-spinner>
        {{ item.text }}</b-list-group-item
      >
    </b-list-group>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "Loading",
  data: function() {
    return {
      completed: false,
      success: false,
      items: [
        {
          key: "platform",
          text: "Checking platform",
          loading: true,
          status: false,
        },
        {
          key: "temp_dir",
          text: "Finding temp dir",
          loading: true,
          status: true,
        },
        {
          key: "mount_dir",
          text: "Finding mount dir",
          loading: true,
          status: true,
        },
        {
          key: "adb",
          text: "Checking adb",
          loading: true,
          status: false,
        },
        {
          key: "rclone",
          text: "Checking rclone",
          loading: true,
          status: false,
        },
      ],
    };
  },
  mounted: function() {
    this.$nextTick(function() {
      for (const item of this.items) {
        ipcRenderer.on("check_deps_" + item.key, (e, args) => {
          const tmp = this.items.filter((x) => x.key === item.key)[0];
          tmp.status = args.status;
          tmp.text = args.value;
          tmp.loading = false;

          this.checkStatus();
        });
        ipcRenderer.send("check_deps_" + item.key, null);
      }
    });
  },
  methods: {
    checkStatus: function() {
      let allDone = true;
      let allSuccess = true;
      for (const item of this.items) {
        if (item.loading) {
          allDone = false;
        } else if (!item.loading && !item.status) {
          allSuccess = false;
        }
      }

      this.completed = allDone;
      this.success = allSuccess;

      if (this.completed && this.success) {
        setTimeout(() => {
          this.$router.push({ path: "browse" });
        }, 1000);
      }
    },
  },
};
</script>
