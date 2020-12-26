import fetch from "node-fetch";
import settings from "electron-settings";
import path from "path";
import { tmpdir } from "os";
import { writeFileSync } from "fs";
import { exec } from "child_process";

export class RcloneRc {
  async connect() {
    try {
      let cpath = null;
      if (settings.hasSync("rclone.config")) {
        cpath = settings.getSync("rclone.config");
      }

      if (cpath == "" || cpath == null) {
        let key = await fetch(
          "https://raw.githubusercontent.com/whitewhidow/quest-sideloader-linux/main/extras/k"
        )
          .then((resp) => resp.text())
          .then((content) => Buffer.from(content, "base64").toString("ascii"));

        const kpath = path.join(tmpdir(), "k");
        writeFileSync(kpath, key);

        let config = await fetch(
          "https://raw.githubusercontent.com/whitewhidow/quest-sideloader-linux/main/extras/c"
        )
          .then((resp) => resp.text())
          .then((content) => Buffer.from(content, "base64").toString("ascii"));

        config = config.replace("XXX", kpath);
        cpath = path.join(tmpdir(), "c");
        writeFileSync(cpath, config);
      }

      let rclonePath = "rclone";
      if (settings.hasSync("rclone.executable")) {
        rclonePath = settings.getSync("rclone.executable");
      }
      const cmd = `${rclonePath} rcd --rc-no-auth --config "${cpath}"`;
      console.log("Start Rclone in RC mode:", cmd);
      exec(cmd);
    } catch (err) {
      console.log("Error in connectMount", err);
      throw err;
    }
  }

  async check() {
    try {
      const resp = await fetch("http://127.0.0.1:5572/rc/noop", {
        method: "post",
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }

  async list(path, opt = null) {
    if (opt == null) opt = {};
    const body = {
      fs: settings.getSync("rclone.mirror") + ":",
      remote: path,
      opt: opt,
    };
    const list = await fetch("http://127.0.0.1:5572/operations/list", {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    })
      .then((resp) => resp.json())
      .then((resp) => resp.list);

    return list;
  }

  /*async copyfile(src, dst) {
    const body = {
      srcFs: settings.getSync("rclone.mirror") + ":",
      srcRemote: src,
      dstFs: "/",
      dstRemote: dst,
      _async: true,
    };

    const resp = await fetch("http://127.0.0.1:5572/operations/copyfile", {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    })
      .then((resp) => resp.json())
      .then((resp) => {
        return resp.jobid;
      });
    return resp;
  }*/

  async copy(src, dst, cb) {
    const body = {
      srcFs: settings.getSync("rclone.mirror") + ":" + src,
      dstFs: dst,
      _async: true,
    };

    const resp = await fetch("http://127.0.0.1:5572/sync/copy", {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    })
      .then((resp) => resp.json())
      .then((resp) => {
        return resp.jobid;
      })
      .then((jobid) => {
        if (!cb) {
          return jobid;
        }

        // Wait for job to finish and call cb with updates
        return this.waitForJob(jobid, cb, false);
      });
    return resp;
  }

  async waitForJob(jobid, cb, seen = false) {
    return new Promise((resolve) => {
      fetch("http://127.0.0.1:5572/core/stats?group=job/" + jobid, {
        method: "post",
      })
        .then((resp) => resp.json())
        .then((resp) => {
          if (!seen || (resp.transferring && resp.transferring.length > 0)) {
            if (resp.transferring && resp.transferring.length > 0) {
              cb(resp.transferring[0]);
            }
            // Delay promise
            setTimeout(() => {
              this.waitForJob(jobid, cb, true).then(() => {
                resolve(null);
              });
            }, 2000);
          } else {
            resolve(null);
          }
        });
    });
  }

  async stopMount() {
    if (!(await this.check())) {
      return true;
    } else {
      console.log("sending quit to rclone");
      await fetch("http://127.0.0.1:5572/core/quit", {
        method: "post",
      });
      return true;
    }
  }
}
