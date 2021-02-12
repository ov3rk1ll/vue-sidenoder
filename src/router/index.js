import Vue from "vue";
import VueRouter from "vue-router";
import Browse from "@/views/Browse.vue";
import InstalledApps from "@/views/InstalledApps.vue";
import Sideload from "@/views/Sideload.vue";
import Storage from "@/views/Storage.vue";
import About from "@/views/About.vue";

Vue.use(VueRouter);

export const routes = [
  {
    path: "/",
    name: "Browse",
    component: Browse,
    showInNav: true,
    icon: "journal-text",
  },
  {
    path: "/installed",
    name: "Installed Apps",
    component: InstalledApps,
    showInNav: true,
    icon: "cpu",
  },
  {
    path: "/sideload",
    name: "Sideload",
    component: Sideload,
    showInNav: true,
    icon: "file-arrow-down",
  },
  {
    path: "/storage",
    name: "Storage",
    component: Storage,
    showInNav: true,
    icon: "files",
  },
  {
    path: "/about",
    name: "About",
    component: About,
    showInNav: true,
    icon: "info-circle",
  },
];

const router = new VueRouter({
  routes,
  linkActiveClass: "active",
});

export default router;
