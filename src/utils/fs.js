import {
  mkdirSync,
  statSync,
  existsSync,
  readdirSync,
  lstatSync,
  unlinkSync,
  rmdirSync,
  writeFileSync,
  readFileSync,
} from "fs";
import path from "path";
import { tmpdir } from "os";

export function workdir() {
  return path.join(tmpdir(), "sideload-dl");
}

export function mkdirsSync(p, opts, made) {
  if (!made) made = null;

  p = path.resolve(p);

  try {
    mkdirSync(p);
    made = made || p;
  } catch (err0) {
    switch (err0.code) {
      case "ENOENT":
        made = mkdirsSync(path.dirname(p), opts, made);
        mkdirsSync(p, opts, made);
        break;

      // In the case of any other error, just see if there's a dir
      // there already.  If so, then hooray!  If not, then something
      // is borked.
      default:
        var stat;
        try {
          stat = statSync(p);
        } catch (err1) {
          throw err0;
        }
        if (!stat.isDirectory()) throw err0;
        break;
    }
  }

  return made;
}

export function deleteFolderRecursive(folder) {
  if (existsSync(folder)) {
    readdirSync(folder).forEach((file) => {
      const curPath = path.join(folder, file);
      if (lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        unlinkSync(curPath);
      }
    });
    rmdirSync(folder);
  }
}

export async function getFiles(dir) {
  const dirents = readdirSync(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

export function copyFileSync(source, target) {
  var targetFile = target;

  // If target is a directory, a new file with the same name will be created
  if (existsSync(target)) {
    if (lstatSync(target).isDirectory()) {
      targetFile = path.join(target, path.basename(source));
    }
  }

  writeFileSync(targetFile, readFileSync(source));
}

export function copyFolderRecursiveSync(source, target) {
  var files = [];

  // Check if folder needs to be created or integrated
  var targetFolder = path.join(target, path.basename(source));
  if (!existsSync(targetFolder)) {
    mkdirSync(targetFolder);
  }

  // Copy
  if (lstatSync(source).isDirectory()) {
    files = readdirSync(source);
    files.forEach(function (file) {
      var curSource = path.join(source, file);
      if (lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}
