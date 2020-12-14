import { platform } from "os";
import { sync as commandExistsSync } from "command-exists";
import settings from "electron-settings";

import { execShellCommand } from "../utils/shell";
import { workdir } from "../utils/fs";

export function bind(ipcMain) {
  ipcMain.on("check_deps_platform", checkDepsPlatform);
  ipcMain.on("check_deps_work_dir", checkDepsWorkdir);
  ipcMain.on("check_deps_rclone", checkDepsRclone);
}

function checkDepsPlatform(event) {
  event.reply("check_deps_platform", {
    status: true,
    value: "Platform: " + platform,
  });
}

function checkDepsWorkdir(event) {
  event.reply("check_deps_work_dir", {
    status: true,
    value: "Work dir: " + workdir(),
  });
}

async function checkDepsRclone(event) {
  let rclonePath = "rclone";
  if (settings.hasSync("rclone.executable")) {
    rclonePath = settings.getSync("rclone.executable");
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
}
