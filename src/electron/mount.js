import settings from "electron-settings";
import ogs from "open-graph-scraper";
import ElectronStore from "electron-store";

import { getInstalledApps } from "./devices";
import globals from "./globals";
import { sortBy } from "../utils/sort";

export function bind(ipcMain) {
  ipcMain.on("check_mount", checkMount);
  ipcMain.on("ls_dir", listDir);
  ipcMain.on("check_folder", checkFolder);
  ipcMain.on("get_installed_apps", getInstalledAppsFromDevice);
}

async function checkMount(event) {
  if (await globals.rclone.check()) {
    event.reply("check_mount", {
      success: true,
      value: "Connected",
    });
  } else {
    connectMount(event);
  }
}

async function connectMount(event) {
  try {
    globals.rclone.connect();
    event.reply("check_mount", {
      success: true,
      value: "Connected",
    });
  } catch (err) {
    console.log("Error in connectMount", err);
  }
}

export async function stopMount() {
  await globals.rclone.stopMount();
}

async function list(dir) {
  if (dir === "/") {
    if (settings.hasSync("rclone.root")) {
      dir = settings.getSync("rclone.root");
    } else {
      dir = "";
    }
  }

  let list = await globals.rclone.list(dir);
  const installedApps = dir === "" ? await getInstalledApps(false) : {};

  // Sort by date so get newest first
  list = sortBy(list, "ModTime", false);

  list = parseList(dir, list, installedApps);
  return list;
}

async function parseList(folder, items, installedApps) {
  const list = [];
  for (const item of items) {
    if (item.Name.startsWith(".") || !item.IsDir) {
      continue;
    }

    let entry = {
      name: item.Name,
      simpleName: item.Name,
      IsDir: item.IsDir,
      imagePath: null,
      versionCode: null,
      versionName: null,
      installedVersion: -1,
      packageName: null,
      mp: false,
      na: false,
      infoLink: null,
      info: null,
      createdAt: new Date(item.ModTime),
      filePath: item.Path.replace(/\\/g, "/"),
    };

    if (new RegExp(".* -steam-").test(item.Name)) {
      const steamid = item.Name.match(/-steam-([0-9]*)/)[1];
      entry.simpleName = entry.simpleName.split(" -steam-")[0];
      entry.imagePath =
        "https://cdn.cloudflare.steamstatic.com/steam/apps/" +
        steamid +
        "/header.jpg?t=" +
        Date.now();
      entry.infoLink = "https://store.steampowered.com/app/" + steamid + "/";
    }
    if (new RegExp(".* -oculus-").test(item.Name)) {
      const oculusid = item.Name.match(/-oculus-([0-9]*)/)[1];
      entry.simpleName = entry.simpleName.split(" -oculus-")[0];
      entry.infoLink =
        "https://www.oculus.com/experiences/quest/" + oculusid + "/";

      const image = await getOculusImage(oculusid);
      if (image) {
        entry.imagePath = image;
      } else {
        entry.imagePath = "https://vrdb.app/oculus/images/" + oculusid + ".jpg";
      }
    }
    if (new RegExp(".* -versionCode-").test(item.Name)) {
      //oculusid = fileEnt.name.split('oculus-')[1]
      entry.versionCode = item.Name.match(/-versionCode-([0-9]*)/)[1];
      entry.simpleName = entry.simpleName.split(" -versionCode-")[0];
    }
    if (new RegExp(".* -packageName-").test(item.Name)) {
      entry.packageName = item.Name.match(/-packageName-([a-zA-Z0-9_.]*)/)[1];
      entry.simpleName = entry.simpleName.split(" -packageName-")[0];
    }

    if (new RegExp(".* -MP-").test(item.Name)) {
      entry.mp = true;
    }

    if (new RegExp(".* -NA-").test(item.Name)) {
      entry.na = true;
    }

    if (!entry.packageName) {
      const inside = await globals.rclone.find(item.Name);
      if (inside) {
        entry = inside;
      } else {
        console.warn("packageName for", entry.name, "was null!");
        continue;
      }
    }

    if (!entry.versionName) {
      const versionName = entry.simpleName.match(/v(\d\S*)/);
      if (versionName == null) {
        const versionNameAlt = entry.simpleName.match(/\[(\d\S*)\]/);
        if (versionNameAlt == null) {
          console.log("parse versionName failed for", entry.simpleName);
        } else {
          entry.versionName = "v" + versionNameAlt[1];
        }
      } else {
        entry.versionName = "v" + versionName[1];
      }
    }

    entry.simpleName = cleanUpFoldername(entry.simpleName);

    if (!entry.imagePath) {
      entry.imagePath = `https://dummyimage.com/460x215/000/fff.jpg&text=${entry.simpleName}`;
    }

    // Check if installed
    if (installedApps[entry.packageName]) {
      entry.installedVersion = installedApps[entry.packageName].versionCode;
    }

    // Check if we already have this package name in the list and if the current entry has a higher versionCode
    const samePackage = list.filter((x) => x.packageName === entry.packageName);
    if (samePackage.length > 0) {
      if (entry.versionCode > samePackage[0].versionCode) {
        // Remove all entries with the packagename
        list.forEach((x, i) => {
          if (x.packageName === entry.packageName) {
            list.splice(i, 1);
            return false;
          }
        });

        // Add entry with newer versionCode
        list.push(entry);
      }
    } else {
      // Add if there is no entry with the package name
      list.push(entry);
    }
  }

  return list;
}

async function getOculusImage(oculusId) {
  const store = new ElectronStore({ name: "oculus-image-cache" });

  // Check cache entry age
  if (store.has("image." + oculusId)) {
    const age = Date.now() - store.get("image." + oculusId + ".created");
    // Invalidate if entry is older than 7 days
    if (age > 604800000) {
      store.delete("image." + oculusId);
    }
  }

  if (store.has("image." + oculusId)) {
    return store.get("image." + oculusId + ".url");
  } else {
    // Start fetch and store result. Nofify list to update image
    const pageUrl =
      "https://www.oculus.com/experiences/quest/" + oculusId + "/";
    ogs(
      {
        url: pageUrl,
        timeout: 5000,
      },
      (error, result) => {
        if (!error) {
          store.set("image." + oculusId, {
            url: result.ogImage.url,
            created: Date.now(),
          });

          // Notify frontend list
          globals.win.webContents.send("browse_better_image_ready", {
            infoLink: pageUrl,
            imageUrl: result.ogImage.url,
          });
        }
      }
    );

    return null;
  }
}

async function listDir(event, args) {
  try {
    const items = await list(args.path);
    event.reply("ls_dir", {
      success: true,
      value: items,
    });
  } catch (e) {
    event.reply("ls_dir", {
      success: false,
      error: e,
    });
  }
}

async function checkFolder(event, args) {
  const files = await globals.rclone.list(args.path, { recurse: true });

  let totalSize = 0;
  for (const file of files) {
    if (file.IsDir) continue;
    totalSize += file.Size;
  }

  const apkFiles = files.filter(
    (x) => x.MimeType === "application/vnd.android.package-archive"
  );
  if (apkFiles.length === 0 || apkFiles.length > 1) {
    event.reply("check_folder", {
      success: false,
      error:
        "Unexpected number of APK files in folder (was " +
        apkFiles.length +
        ")",
    });
    return;
  }
  const hasFolders =
    files.filter((x) => x.IsDir && x.Name === args.item.packageName).length > 0;

  event.reply("check_folder", {
    success: true,
    value: { path: args.path, apk: apkFiles[0], hasObb: hasFolders, totalSize },
  });
}

function cleanUpFoldername(simpleName) {
  simpleName = simpleName.split("-QuestUnderground")[0];
  simpleName = simpleName.split(/v[0-9+.]*\./)[0];
  //simpleName = simpleName.split(/v[0-9][0-9]\./)[0]
  //simpleName = simpleName.split(/v[0-9][0-9][0-9]\./)[0]
  simpleName = simpleName.split(/\[[0-9]*\./)[0];
  simpleName = simpleName.split(/\[[0-9]*\]/)[0];
  simpleName = simpleName.trim();

  return simpleName;
}

async function getInstalledAppsFromDevice(event) {
  event.reply("get_installed_apps", {
    success: true,
    value: await getInstalledApps(true),
  });
}
