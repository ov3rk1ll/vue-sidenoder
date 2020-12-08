import { ipcMain } from "electron";
import { tmpdir } from "os";
import { existsSync } from "fs";
import path from "path";

import globals from "./globals";
import { copy, waitForJob } from "./rclone";
import { formatEta, formatBytes } from "../utils/formatter";
import { mkdirsSync, deleteFolderRecursive } from "../utils/fs";
import { Logger } from "../utils/logger";
import { execShellCommand } from "../utils/shell";

ipcMain.on("sideload_folder", async (event, args) => {
  const logger = new Logger("Sideload");
  logger.info("args:", args);

  const isInstalled = args.app.installedVersion !== -1;

  const tasks = [
    {
      key: "device",
      text: "Checking device",
      started: true,
      loading: true,
      status: false,
      show: true,
    },
    {
      key: "download",
      text: "Download files",
      started: false,
      loading: false,
      status: false,
      show: true,
    },
    {
      key: "packageinfo",
      text: "Read packageinfo",
      started: false,
      loading: false,
      status: false,
      show: true,
    },
    {
      key: "install1",
      text: "Install APK",
      started: false,
      loading: false,
      status: false,
      show: true,
    },
    {
      key: "backup",
      text: "Backup Appdata",
      started: false,
      loading: false,
      status: false,
      show: false,
    },
    {
      key: "uninstall",
      text: "Uninstall APK",
      started: false,
      loading: false,
      status: false,
      show: false,
    },
    {
      key: "restore",
      text: "Restore Appdata",
      started: false,
      loading: false,
      status: false,
      show: false,
    },
    {
      key: "install2",
      text: "Install APK",
      started: false,
      loading: false,
      status: false,
      show: false,
    },
    {
      key: "copy_obb",
      text: "Copy OBB",
      started: false,
      loading: false,
      status: false,
      show: args.data.hasObb,
    },
    {
      key: "cleanup",
      text: "Cleanup",
      started: false,
      loading: false,
      status: false,
      show: true,
    },
    {
      key: "done",
      text: "Sideload finished",
      started: false,
      loading: false,
      status: false,
      show: true,
    },
  ];

  globals.win.webContents.send("sideload_folder_progress", { items: tasks });

  // Check for connected device

  const devices = await globals.adb.listDevices();
  logger.debug("devices:", devices);
  if (devices == null || devices.length == 0) {
    updateTask(tasks, "device", true, false, false, "No device connected");
  } else {
    updateTask(
      tasks,
      "device",
      true,
      false,
      true,
      "Device connected - " + devices[0].id
    );
  }
  globals.win.webContents.send("sideload_folder_progress", { items: tasks });

  // Download folder
  updateTask(tasks, "download", true, true, false, "Starting download...");

  const tempFolder = path.join(tmpdir(), "sideload-dl", args.data.path);
  logger.debug("tempFolder:", tempFolder);
  if (existsSync(tempFolder)) {
    deleteFolderRecursive(tempFolder);
  }
  mkdirsSync(tempFolder, { recursive: true });

  const apkFile = path.join(tempFolder, args.data.apk.Name);

  logger.debug("copy", args.data.path, "to", tempFolder);

  const jobId = await copy(args.data.path, tempFolder);

  await waitForJob(jobId, (data) => {
    updateTask(
      tasks,
      "download",
      true,
      true,
      false,
      "Downloading files - " +
        data.percentage +
        "% (" +
        formatBytes(data.bytes) +
        " / " +
        formatBytes(data.size) +
        ")" +
        " - " +
        formatBytes(data.speedAvg) +
        "/s" +
        " - " +
        formatEta(data.eta)
    );
  });
  logger.debug("Job", jobId, "has finished");

  const apkFileExists = existsSync(apkFile);
  updateTask(
    tasks,
    "download",
    true,
    false,
    apkFileExists,
    apkFileExists ? "Download completed" : "Download failed"
  );

  if (!apkFileExists) {
    // TODO: Cancel because download failed
  }

  // Read package info from filename or file content
  const packageName = args.app.packageName;

  updateTask(tasks, "packageinfo", true, false, true, undefined);

  updateTask(tasks, "install1", true, true, false, "Installing app");

  const normalInstall = await installApp(devices[0].id, apkFile);
  updateTask(
    tasks,
    "install1",
    true,
    false,
    normalInstall,
    normalInstall ? "Installed app" : "Installation failed"
  );

  // TODO: Check error
  if (!normalInstall) {
    // TODO: Handle update
    // Show extra steps
    let task = tasks.filter((x) => x.key === "backup")[0];
    task.show = true;
    task = tasks.filter((x) => x.key === "uninstall")[0];
    task.show = true;
    task = tasks.filter((x) => x.key === "restore")[0];
    task.show = true;
    task = tasks.filter((x) => x.key === "install2")[0];
    task.show = true;
    globals.win.webContents.send("sideload_folder_progress", { items: tasks });

    const appdataFolder = path.join(tempFolder, "appdata");
    mkdirsSync(appdataFolder, { recursive: true });

    updateTask(tasks, "backup", true, true);
    await execShellCommand(
      `adb pull "/sdcard/Android/data/${packageName}" "${appdataFolder}"`
    );
    updateTask(tasks, "backup", true, false, true);

    updateTask(tasks, "uninstall", true, true);
    await execShellCommand(`adb uninstall "${packageName}"`);
    updateTask(tasks, "uninstall", true, false, true);

    updateTask(tasks, "restore", true, true);
    globals.win.webContents.send("sideload_folder_progress", { items: tasks });
    await execShellCommand(
      `adb push "${appdataFolder}" "/sdcard/Android/data/${packageName}"`
    );
    updateTask(tasks, "restore", true, false, true);

    updateTask(tasks, "install2", true, true, false, "Installing app");
    const freshInstall = await installApp(devices[0].id, apkFile);
    updateTask(
      tasks,
      "install2",
      true,
      false,
      freshInstall,
      freshInstall ? "Installed app" : "Installation failed"
    );
  }

  // TODO: Break on error

  if (!args.data.hasObb) {
    updateTask(
      tasks,
      "copy_obb",
      false,
      true,
      false,
      "Copy OBB - Skipped (no obb files)"
    );
  } else {
    updateTask(tasks, "copy_obb", true, true, false, "Copying OBB files...");

    const deviceObbFolder = `/sdcard/Android/obb/${packageName}`;
    const obbFolder = path.join(tempFolder, packageName);

    await execShellCommand(`adb shell rm -r "${deviceObbFolder}"`);
    await execShellCommand(`adb push "${obbFolder}" "${deviceObbFolder}"`);

    updateTask(tasks, "copy_obb", true, false, true, "OBB files copied");
  }

  updateTask(tasks, "cleanup", true, true, false, "Cleanup...");

  // Delete tempFolder
  await deleteFolderRecursive(tempFolder);

  updateTask(tasks, "cleanup", true, false, true, "Cleanup...");

  updateTask(tasks, "done", true, false, true);

  globals.win.webContents.send("sideload_folder_progress", {
    items: tasks,
    done: true,
  });
});

ipcMain.on("uninstall_app", async (event, args) => {
  const logger = new Logger("Uninstall");
  logger.info("args:", args);

  const packageName = args.packageName;

  const tasks = [
    {
      key: "device",
      text: "Checking device",
      started: true,
      loading: true,
      status: false,
      show: true,
    },
    {
      key: "uninstall",
      text: "Uninstall APK",
      started: false,
      loading: false,
      status: false,
      show: true,
    },
    {
      key: "done",
      text: "Uninstall finished",
      started: false,
      loading: false,
      status: false,
      show: true,
    },
  ];
  globals.win.webContents.send("sideload_folder_progress", { items: tasks });

  // Check for connected device
  const devices = await globals.adb.listDevices();
  logger.debug("devices:", devices);
  if (devices == null || devices.length == 0) {
    updateTask(tasks, "device", true, false, false, "No device connected");
  } else {
    updateTask(
      tasks,
      "device",
      true,
      false,
      true,
      "Device connected - " + devices[0].id
    );
  }

  updateTask(tasks, "uninstall", true, true);
  await execShellCommand(`adb uninstall "${packageName}"`);
  updateTask(tasks, "uninstall", true, false, true);

  updateTask(tasks, "done", true, false, true);

  globals.win.webContents.send("sideload_folder_progress", {
    items: tasks,
    done: true,
  });
});

function updateTask(tasks, key, started, loading, status, text) {
  const task = tasks.filter((x) => x.key === key)[0];
  if (started != undefined) {
    task.started = started;
  }
  if (loading != undefined) {
    task.loading = loading;
  }
  if (status != undefined) {
    task.status = status;
  }
  if (text != undefined) {
    task.text = text;
  }
  globals.win.webContents.send("sideload_folder_progress", { items: tasks });
}

async function installApp(deviceId, apkFile) {
  const logger = new Logger("InstallApp");
  try {
    logger.debug("install", apkFile);
    const installState = await globals.adb.install(deviceId, apkFile);
    logger.debug("installed", installState);
    return installState;
  } catch (e) {
    logger.error("Error", e);
    return false;
  }
}
