import settings from "electron-settings";

export function bind(ipcMain) {
  ipcMain.on("put_setting", putSetting);
  ipcMain.on("get_setting", getSetting);
}

async function putSetting(event, args) {
  await settings.set(args.key, args.value);
  event.reply("put_setting", {
    success: true,
    key: args.key,
  });
}

async function getSetting(event, args) {
  const value = await settings.get(args.key);
  event.reply("get_setting", {
    success: true,
    key: args.key,
    value: value,
  });
}
