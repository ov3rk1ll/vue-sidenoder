import path from "path";
import { promises as fs } from "fs";
import mime from "mime-types";
import ApkReader from "node-apk-parser";

// import { Logger } from "../../utils/logger";
// const logger = new Logger("FS");

export class LocalFs {
  constructor(root) {
    this.root = root;
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
  async list(folder, opt = null) {
    opt = Object.assign({}, { recurse: false, depth: -1, _depth: 0 }, opt);
    const dir = path.join(this.root, folder);
    const dirents = await fs.readdir(dir, { withFileTypes: true });

    const files = await Promise.all(
      dirents.map(async (dirent) => {
        const p = path.join(dir, dirent.name);
        const stat = await fs.stat(p);
        const t = {
          Name: dirent.name,
          Path: p,
          IsDir: dirent.isDirectory(),
          MimeType: dirent.isDirectory()
            ? "inode/directory"
            : mime.lookup(dirent.name),
          ModTime: stat.mtime,
          Size: dirent.isDirectory() ? 0 : stat.size,
        };
        return dirent.isDirectory() &&
          opt.recurse &&
          (opt.depth == -1 || opt._depth < opt.depth)
          ? this.list(
              path.join(folder, t.Name),
              Object.assign(opt, { _depth: opt._depth + 1 })
            )
          : t;
      })
    );
    return Array.prototype.concat(...files);
  }

  async find(folder) {
    const files = await this.list(folder, { recurse: true, depth: 0 });
    const apkFile = files.find(
      (x) => x.MimeType === "application/vnd.android.package-archive"
    );

    if (apkFile) {
      const reader = ApkReader.readFile(apkFile.Path);
      const manifest = reader.readManifestSync();
      return {
        name: manifest.application.label,
        simpleName: manifest.application.label,
        IsDir: false,
        imagePath: null,
        versionCode: manifest.versionCode,
        versionName: manifest.versionName,
        installedVersion: -1,
        packageName: manifest.package,
        mp: false,
        na: false,
        infoLink: null,
        info: null,
        createdAt: new Date(apkFile.ModTime),
        filePath: folder.replace(/\\/g, "/"),
      };
    } else {
      return null;
    }
  }

  // eslint-disable-next-line no-unused-vars
  async copy(src, dst, cb) {
    // TODO: Don't copy?
  }

  async stopMount() {
    // TODO: Implement something?
  }
}
