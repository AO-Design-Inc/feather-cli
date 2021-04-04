import {Command, flags} from '@oclif/command';
import {readFileSync} from 'fs';
import {prompt} from 'inquirer';
import {ArweaveUtils} from '../i';
import {WASI} from '@wasmer/wasi';
import wasiBindings from '@wasmer/wasi/lib/bindings/node';
import {lowerI64Imports} from '@wasmer/wasm-transformer';
const wasi = new WASI({
  args: [],
  env: {},
  bindings: {
    ...wasiBindings
  }
});
interface ExecData {
  fileaddress: string;
}
export default class ExecWasm extends Command {
  static description = 'Run a local wasm file.';
  async getInteractiveArgs() {
    const answer = await prompt([
      {
        type: 'string',
        name: 'fileaddress',
        message: 'Type/Drop in the path to your .WASM file: ',
        default: null,
        validate: (value) => ArweaveUtils.isPath(value)
      }
    ]);

    return answer;
  }

  static flags = {
    help: flags.help({char: 'h'})
  };

  static args = [{name: 'file'}];
  async makeExec(execData: ExecData) {
    const {fileaddress} = execData;
    // Load file
    const file = readFileSync(fileaddress);
    // Instantiate webassembly file
    const wasm_bytes: Uint8Array = new Uint8Array(file);
    const lowered_wasm = await lowerI64Imports(wasm_bytes);
    const module = await WebAssembly.compile(lowered_wasm);
    const instance = await WebAssembly.instantiate(module, {
      ...wasi.getImports(module)
    });
    wasi.start(instance);
  }

  async run() {
    const {args, flags} = this.parse(ExecWasm);
    const {count} = args;
    const execData: ExecData =
      count !== null && count > 0
        ? {
            fileaddress: ''
          }
        : await this.getInteractiveArgs();
    await this.makeExec(execData).catch((error) => {
      console.log(error);
    });
  }
}
