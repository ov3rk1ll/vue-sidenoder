import { ipcMain } from "electron";
import { platform } from "os";
import { sync as commandExistsSync } from "command-exists";
import settings from "electron-settings";

import { execShellCommand } from "../utils/shell";
import { workdir } from "../utils/fs";

ipcMain.on("check_deps_platform", (event) => {
  event.reply("check_deps_platform", {
    status: true,
    value: "Platform: " + platform,
  });
});

ipcMain.on("check_deps_work_dir", (event) => {
  event.reply("check_deps_work_dir", {
    status: true,
    value: "Work dir: " + workdir(),
  });
});

ipcMain.on("check_deps_rclone", async (event) => {
  let rclonePath = "rclone";
  if (await settings.has("rclone")) {
    rclonePath = await settings.get("rclone");
  }
  const exists = commandExistsSync(rclonePath);
  let version = null;

  if (exists) {
    let output = await execShellCommand(`${rclonePath} --version`);
    version = output
      .split("\n")[0]
      .trim()
      .split(" ")[1];
  }

  event.reply("check_deps_rclone", {
    status: exists,
    value: exists ? "Rclone detected - " + version : "Install Rclone globally!",
  });
});
