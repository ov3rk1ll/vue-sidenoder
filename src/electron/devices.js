import { ipcMain } from "electron";

import globals from "./globals";

ipcMain.on("check_device", (event) => {
  globals.adb.listDevices().then((devices) => {
    console.log("listDevices", devices);
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
