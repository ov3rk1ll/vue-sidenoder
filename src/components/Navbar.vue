<template>
  <nav>
    <b-navbar toggleable="lg" type="light" variant="light">
      <b-navbar-brand :to="{ path: '/' }">QSL</b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-item :to="{ path: '/browse' }" exact>Browse</b-nav-item>
          <b-nav-item :to="{ path: '/installed' }">Installed apps</b-nav-item>
          <b-nav-item :to="{ path: '/sideload' }">Sideload app</b-nav-item>
          <b-nav-item :to="{ path: '/about' }">About</b-nav-item>
        </b-navbar-nav>

        <!-- Right aligned nav items -->
        <b-navbar-nav class="ml-auto">
          <NavbarStatus title="Mount status" event="check_mount" />
          <NavbarStatus title="Quest status" event="check_device" />
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </nav>
</template>

<script>
export default {
  name: "Navbar",
  props: {
    msg: String,
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
nav {
  margin-bottom: 2rem;
}
</style>
