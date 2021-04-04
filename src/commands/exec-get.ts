import { Command, flags } from "@oclif/command";
import { prompt } from "inquirer";
import { createWriteStream, open, readFileSync } from "fs";
import { readContract } from "smartweave";
import { ArweaveUtils } from "../i";
import { https } from "follow-redirects";
interface ExecData {
  executable: string,
  bid: boolean;
}
export default class ExecuteGetFile extends Command {
  async getInteractiveArgs() {
    const answer = await prompt([
      {
        type: "list",
        name: "executable",
        message: "Select the executables",
        default: [
          { name: 1, value: 1 },
          { name: 2, value: 2 },
        ],
        choices: async () => ArweaveUtils.getContract(),
      },
      {
        type: "confirm",
        name: "bid",
        message: "Do you want the file you bid for?",
      },
    ]);
    return answer;
  }

  async makeExec(execData: ExecData) {
    const {executable, bid} = execData;
    const c = await readContract(
      ArweaveUtils.client,
      ArweaveUtils.contractID
    );
    const address: string =
      c.executables[executable]
        .executable.executable_address;
    console.log(address);
    const ref = `https://arweave.net/${address}`;

    open(`${address}-feather.wasm`, "w", (error: any, file: any) => {
      if (error) throw error;
      console.log("Saved!");
    });
    const file = createWriteStream(`${address}-feather.wasm`);
    const request = https.get(ref, (response: any) => {
      response.pipe(file);
    });
    console.log("Download Complete");
  }

  async run() {
    this.log("Welcome to Feather");
    const { args, flags } = this.parse(ExecuteGetFile);
    const { count } = args;
    const { araddress } = flags;

    const execData: ExecData =
      count !== null && count > 0 && araddress === null
        ? {
            bid: false,
          }
        : await this.getInteractiveArgs();
    await this.makeExec(execData);
  }
}
