import fetch from "node-fetch";
import path from "path";
import { createWriteStream } from "fs";

import { Logger } from "../../utils/logger";
import { mkdirsSync } from "../../utils/fs";
const logger = new Logger("SideQuest");

export class Sidequest {
  constructor() {
    this.url = `https://api.sidequestvr.com`;
  }

  async connect() {
    // TODO: Implement something?
  }

  async check() {
    // TODO: Implement something?
    return true;
  }

  /**
   * @typedef ListEntry
   * @property {string} Name Name of the entry
   * @property {string} Path Full path to the entry
   * @property {bool} IsDir True for directory, false for file
   * @property {string} MimeType MimeType for entry
   * @property {string} ModTime Last modified date
   * @property {number} Size Size of the file
   */

  /**
   *
   * @param {string} folder
   * @param {any} opt
   * @returns {Promise<ListEntry>} A promise for the list at the given path
   */
  // eslint-disable-next-line no-unused-vars
  async list(folder, opt = null) {
    if (folder) {
      return await this.getItemDownload(folder, true);
    }

    const list = await fetch(
      `${this.url}/search-apps?search=&page=0&order=name&direction=asc&app_categories_id=1&tag=null&users_id=null&limit=1000&device_filter=quest&license_filter=free`,
      {
        method: "get",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Origin: "https://sidequestvr.com",
        },
      }
    )
      .then((resp) => resp.json())
      .then((resp) => resp.data);

    const entries = [];
    for (const e of list) {
      let entry = {
        __parsed: true,
        name: e.name,
        simpleName: e.name,
        IsDir: true,
        imagePath: e.image_url,
        versionCode: e.versioncode,
        versionName: "v" + e.versioncode,
        installedVersion: -1,
        packageName: e.packagename,
        mp: false,
        na: false,
        infoLink: `https://sidequestvr.com/community/${e.apps_id}`,
        info: null,
        createdAt: new Date(parseInt(e.created) * 1000),
        filePath: "sidequest-" + e.apps_id,
      };

      entries.push(entry);
    }

    return entries;
  }

  async getItemDownload(appId, withSize) {
    if (appId.startsWith("sidequest-")) {
      appId = appId.substr("sidequest-".length);
    }

    // Get token
    const install = await fetch(`${this.url}/generate-install`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://sidequestvr.com",
      },
      body: JSON.stringify({ msg: { apps_id: appId } }),
    })
      .then((resp) => resp.json())
      .then((resp) => resp.data);

    // Get app details with token
    const app = await fetch(`${this.url}/install-from-key`, {
      method: "post",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://sidequestvr.com",
      },
      body: JSON.stringify({ token: install.key }),
    })
      .then((resp) => resp.json())
      .then((resp) => resp.data.apps[0]);

    // Check for usable provider
    const urls = app.urls.filter(
      (x) => x && ~["Github Release", "APK", "OBB", "Mod"].indexOf(x.provider)
    );

    if (urls.length === 0) {
      logger.warn("No URLS in", app);
    }

    const files = [];
    for (const url of urls) {
      const ext = url.link_url.split("?")[0].split(".").pop().toLowerCase();

      let fileSize = -1;
      if (withSize) {
        // FIXME: Get size for some providers in a different way
        const contentLength = await fetch(url.link_url, {
          method: "head",
        }).then((resp) => resp.headers.get("content-length"));
        fileSize = contentLength ? parseInt(contentLength) : 0;
      }

      if (ext === "obb") {
        files.push({
          IsDir: true,
          Name: app.packagename,
          MimeType: "obb",
          Path: url.link_url,
          Size: fileSize,
        });
      } else {
        files.push({
          Name: app.packagename + ".apk",
          IsDir: false,
          MimeType: "application/vnd.android.package-archive",
          Path: url.link_url,
          Size: fileSize,
        });
      }
    }

    return files;
  }

  // eslint-disable-next-line no-unused-vars
  async find(folder) {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  async copy(src, dst, cb) {
    // TODO: Use cb for progress?
    const urls = await this.getItemDownload(src, false);
    for (const url of urls) {
      let dstFile = path.join(dst, url.Name);
      if (url.MimeType === "obb") {
        const obbFolder = path.join(dst, url.Name);
        mkdirsSync(obbFolder);
        dstFile = path.join(obbFolder, path.basename(url.Path));
      }
      logger.debug("download", url.Path, "to", dstFile);

      const res = await fetch(url.Path);
      await new Promise((resolve, reject) => {
        const fileStream = createWriteStream(dstFile);
        res.body.pipe(fileStream);
        res.body.on("error", (err) => {
          logger.error("download", url.Path, "to", dstFile, "- ERROR:", err);
          fileStream.close();
          reject(err);
        });
        fileStream.on("finish", function () {
          fileStream.close();
          resolve();
        });
      });
    }
  }

  async stopMount() {
    // TODO: Implement something?
  }
}
