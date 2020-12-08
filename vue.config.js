module.exports = {
  pluginOptions: {
    electronBuilder: {
      // Use this to change the entrypoint of your app's main process
      mainProcessFile: "src/electron/background.js",
      nodeIntegration: true,
      mainProcessWatch: ["src/electron/*.js"],
    },
  },
};
