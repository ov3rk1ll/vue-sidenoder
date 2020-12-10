import { ipcMain } from "electron";
import { platform, tmpdir } from "os";
import { sync as commandExistsSync } from "command-exists";

import globals from "./globals";

ipcMain.on("check_deps_platform", (event) => {
  event.reply("check_deps_platform", {
    status: true,
    value: "Platform: " + platform,
  });
});

ipcMain.on("check_deps_temp_dir", (event) => {
  event.reply("check_deps_temp_dir", {
    status: true,
    value: "Temp dir detected: " + tmpdir(),
  });
});

ipcMain.on("check_deps_mount_dir", (event) => {
  event.reply("check_deps_mount_dir", {
    status: true,
    value: "Mount dir detected: " + globals.mountFolder,
  });
});

ipcMain.on("check_deps_adb", (event) => {
  const exists = commandExistsSync("adb");
  // Download https://dl.google.com/android/repository/platform-tools-latest-windows.zip
  // Download https://dl.google.com/android/repository/platform-tools-latest-darwin.zip
  // Download https://dl.google.com/android/repository/platform-tools-latest-linux.zip
  event.reply("check_deps_adb", {
    status: exists,
    value: exists ? "ADB detected" : "Install ADB globally!",
  });
});

ipcMain.on("check_deps_rclone", (event) => {
  const exists = commandExistsSync("rclone");
  // Download https://downloads.rclone.org/v1.53.3/rclone-v1.53.3-windows-amd64.zip
  // Download https://downloads.rclone.org/v1.53.3/rclone-v1.53.3-osx-amd64.zip
  // Download https://downloads.rclone.org/v1.53.3/rclone-v1.53.3-linux-amd64.zip
  event.reply("check_deps_rclone", {
    status: exists,
    value: exists ? "Rclone detected" : "Install Rclone globally!",
  });
});
