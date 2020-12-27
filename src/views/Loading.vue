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
        {{ item.text }}
        <b-button
          size="sm"
          class="float-right"
          v-if="!item.loading && !item.status && item.click"
          @click="pickDepPath(item.click)"
          >Select {{ item.click.title }}</b-button
        >
      </b-list-group-item>
    </b-list-group>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  name: "Loading",
  data: function () {
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
          key: "work_dir",
          text: "Finding work dir",
          loading: true,
          status: true,
        },
        {
          key: "adb",
          text: "Checking ADB",
          loading: true,
          status: false,
          click: {
            title: "Select ADB",
            file: "adb",
            key: "adb.executable",
          },
        },
        {
          key: "rclone",
          text: "Checking rclone",
          loading: true,
          status: false,
          click: {
            title: "Select RClone",
            file: "rclone",
            key: "rclone.executable",
          },
        },
      ],
    };
  },
  mounted: function () {
    this.$nextTick(function () {
      this.runCheck();
    });
  },
  methods: {
    runCheck() {
      for (const item of this.items) {
        ipcRenderer.once("check_deps_" + item.key, (e, args) => {
          const tmp = this.items.filter((x) => x.key === item.key)[0];
          tmp.status = args.status;
          tmp.text = args.value;
          tmp.loading = false;

          this.checkStatus();
        });
        ipcRenderer.send("check_deps_" + item.key, null);
      }
    },
    checkStatus() {
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
          this.$emit("ready");
        }, 1000);
      }
    },
    pickDepPath(param) {
      ipcRenderer.once("pick_dep_path", () => {
        this.runCheck();
      });
      ipcRenderer.send("pick_dep_path", param);
    },
  },
};
</script>
