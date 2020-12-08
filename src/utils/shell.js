import { exec } from "child_process";

export function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      if (stdout) {
        // console.log(stdout);
        resolve(stdout);
      } else {
        console.log(stderr);
        resolve(stderr);
      }
    });
  });
}
