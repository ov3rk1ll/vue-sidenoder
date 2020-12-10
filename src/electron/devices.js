import { ipcMain } from "electron";

import { execShellCommand } from "../utils/shell";
import globals from "./globals";

ipcMain.on("check_device", (event) => {
  globals.adb.listDevices().then((devices) => {
    if (devices == null || devices.length == 0) {
      event.reply("check_device", {
        success: false,
        value: "No device found!",
      });
    } else {
      globals.device = devices[0];
      event.reply("check_device", {
        success: true,
        value: "Connected",
        device: devices[0].id,
      });
    }
  });
});

export async function getInstalledApps() {
  if (!globals.device) {
    return {};
  }
  console.time("read list");
  const apps = (
    await execShellCommand(`adb shell cmd package list packages -3`)
  ) // Read packages
    .split("\n") // Split lines
    .filter((x) => !!x) // Remove empty lines
    .map((x) => x.trim().split(":")[1]); // remove leading "package:" from each entry
  // const apps = await globals.adb.getPackages(globals.device.id);
  console.timeEnd("read list");

  const appInfo = {};

  console.time("parse list");
  for (const app of apps) {
    appInfo[app] = {
      packageName: app,
      versionCode: null,
      debug: false,
      system: false,
    };

    const info = await getAppInfo(app);
    if (info != null) {
      appInfo[app] = info;
    }
  }
  console.timeEnd("parse list");

  return appInfo;
}

export async function getAppInfo(packageName) {
  const appInfo = {
    packageName: packageName,
    versionCode: null,
    debug: false,
    system: false,
  };
  try {
    console.time(`parse ${packageName}`);
    const info = await execShellCommand(
      `adb shell dumpsys package ${packageName}`
    );
    // const path = await execShellCommand(`adb shell pm path ${app}`).slice(8);

    appInfo.versionCode = info.match(/versionCode=[0-9]*/)[0].slice(12);
    let pkgFlags = /.*pkgFlags=\[(.*)\]/m.exec(info);
    if (pkgFlags) {
      pkgFlags = pkgFlags[1].trim().split(" ");

      appInfo.debug = pkgFlags.includes("DEBUGGABLE");
      appInfo.system = pkgFlags.includes("SYSTEM");
    }
    console.timeEnd(`parse ${packageName}`);
  } catch (e) {
    return null;
  }
  return appInfo;
}

// Also trackDevices
/*globals.adb
  .trackDevices()
  .then(function(tracker) {
    tracker.on("add", (device) => {
      globals.win.webContents.send("check_device", {
        success: true,
        value: device.id,
      });
      console.log("Device %s was plugged in", device.id);
    });
    tracker.on("remove", (device) => {
      // TODO: Check if this is the only device
      globals.win.webContents.send("check_device", {
        success: false,
        value: "No device found!",
      });
      console.log("Device %s was unplugged", device.id);
    });
    tracker.on("end", () => {
      console.log("Tracking stopped");
    });
  })
  .catch((err) => {
    console.error("Something went wrong:", err.stack);
  });*/
