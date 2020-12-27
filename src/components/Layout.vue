<template>
  <div>
    <div v-if="loading">
      <b-container class="mt-4">
        <Loading v-on:ready="onReady" />
      </b-container>
    </div>
    <div v-if="!loading">
      <Navbar />
      <b-container fluid><router-view></router-view></b-container>
    </div>
  </div>
</template>

<script>
export default {
  name: "Layout",
  data: function () {
    return {
      loading: true,
    };
  },
  created() {
    this.loading = true;
  },
  methods: {
    onReady() {
      this.loading = false;
    },
  },
};
</script>

<style scoped></style>
