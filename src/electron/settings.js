import { ipcMain } from "electron";
import settings from 'electron-settings';

ipcMain.on("put_setting", async (event, args) => {
  await settings.set(args.key, args.value);
  event.reply("put_setting", {
    success: true,
    key: args.key,
  });
});

ipcMain.on("get_setting", async (event, args) => {
  const value = await settings.get(args.key);
  event.reply("get_setting", {
    success: true,
    key: args.key,
    value: value,
  });
});