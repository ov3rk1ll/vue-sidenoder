import Vue from "vue";
import VueRouter from "vue-router";
import Loading from "@/views/Loading.vue";
import Browse from "@/views/Browse.vue";
import InstalledApps from "@/views/InstalledApps.vue";
import About from "@/views/About.vue";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Loading",
    component: Loading,
  },
  {
    path: "/browse",
    name: "Browse",
    component: Browse,
  },
  {
    path: "/installed",
    name: "Installed Apps",
    component: InstalledApps,
  },
  {
    path: "/about",
    name: "About",
    component: About,
  },
];

const router = new VueRouter({
  routes,
  linkActiveClass: "active",
});

export default router;
