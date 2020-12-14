import Vue from "vue";
import VueRouter from "vue-router";
import Loading from "@/views/Loading.vue";
import Browse from "@/views/Browse.vue";
import InstalledApps from "@/views/InstalledApps.vue";
import Sideload from "@/views/Sideload.vue";
import About from "@/views/About.vue";

Vue.use(VueRouter);

export const routes = [
  {
    path: "/",
    name: "Loading",
    component: Loading,
    showInNav: false,
  },
  {
    path: "/browse",
    name: "Browse",
    component: Browse,
    showInNav: true,
  },
  {
    path: "/installed",
    name: "Installed Apps",
    component: InstalledApps,
    showInNav: true,
  },
  {
    path: "/sideload",
    name: "Sideload",
    component: Sideload,
    showInNav: true,
  },
  {
    path: "/about",
    name: "About",
    component: About,
    showInNav: true,
  },
];

const router = new VueRouter({
  routes,
  linkActiveClass: "active",
});

export default router;
