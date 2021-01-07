import path from "path";
import { promises as fs } from "fs";
import mime from "mime-types";

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
   */

  /**
   *
   * @param {string} folder
   * @param {any} opt
   * @returns {Promise<ListEntry>} A promise for the list at the given path
   */
  async list(folder, opt = null) {
    opt = Object.assign({}, opt, { recurse: true });
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
        };
        return dirent.isDirectory() && opt.recurse
          ? this.list(path.join(folder, t.Name), opt)
          : t;
      })
    );
    return Array.prototype.concat(...files);
  }

  // eslint-disable-next-line no-unused-vars
  async copy(src, dst, cb) {
    // TODO: Don't copy?
  }

  async stopMount() {
    // TODO: Implement something?
  }
}
