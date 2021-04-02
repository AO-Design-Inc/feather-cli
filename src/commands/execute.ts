import {readFileSync, readFile, PathLike, promises} from 'fs';
import {Command} from '@oclif/command';
import {prompt} from 'inquirer';
import {Constants} from '../i';
import {WASI} from 'wasi';
const wasi = new WASI();
const importObject = {wasi_snapshot_preview1: wasi.wasiImport};
interface ExecData {
  fileaddress: string;
}
export default class Execute extends Command {
  async getInteractiveArgs() {
    const answer = await prompt([
      {
        type: 'string',
        name: 'fileaddress',
        message: 'Type/Drop in the path to your .WASM file: ',
        default: null,
        validate: (value) => Constants.isPath(value)
      }
    ]);

    return answer;
  }

  async makeExec(execData: ExecData) {
    const {fileaddress} = execData;
    const wasm = await WebAssembly.compile(readFileSync(fileaddress));
    const instance = await WebAssembly.instantiate(
      wasm,
      importObject
    );
    wasi.start(instance);
  }

  async run() {
    this.log('Welcome to Feather');
    const {args, flags} = this.parse(Execute);
    const {count} = args;
    const {araddress} = flags;
    const execData: ExecData =
      count !== null && count > 0 && araddress === null
        ? {
            fileaddress: ''
          }
        : await this.getInteractiveArgs();

    await this.makeExec(execData).catch((error) => {
      console.log(error);
    });
  }
}
