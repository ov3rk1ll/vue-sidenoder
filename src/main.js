import Vue from "vue";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";
import { BootstrapVue, BootstrapVueIcons } from "bootstrap-vue";
import Toast from "vue-toastification";

import App from "./App.vue";
import "./style/main.scss";
import router from "./router";

import { formatBytes } from "./utils/formatter";

import Loading from "@/views/Loading.vue";

Vue.config.productionTip = false;

Vue.use(BootstrapVue);
Vue.use(BootstrapVueIcons);
Vue.use(Toast, {
  transition: "Vue-Toastification__fade",
  maxToasts: 20,
  newestOnTop: true,
});

// globally register components
const requireComponent = require.context(
  "./components",
  false,
  /[A-Z]\w+\.(vue|js)$/
);

requireComponent.keys().forEach((fileName) => {
  // Get component config
  const componentConfig = requireComponent(fileName);

  // Get PascalCase name of component
  const componentName = upperFirst(
    camelCase(
      // Gets the file name regardless of folder depth
      fileName
        .split("/")
        .pop()
        .replace(/\.\w+$/, "")
    )
  );

  // Register component globally
  Vue.component(
    componentName,
    // Look for the component options on `.default`, which will
    // exist if the component was exported with `export default`,
    // otherwise fall back to module's root.
    componentConfig.default || componentConfig
  );
});

Vue.component("Loading", Loading);

// Register filters
Vue.filter("formatBytes", formatBytes);

new Vue({
  router,
  render: (h) => h(App),
}).$mount("#app");
