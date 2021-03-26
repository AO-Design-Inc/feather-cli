import {Command, flags} from '@oclif/command';
import {prompt} from 'inquirer';
import {createWriteStream, open, readFileSync} from 'fs';
import {readContract} from 'smartweave';
import {Constants} from '../i';
import {https} from 'follow-redirects';
interface ExecData {
  bid: boolean;
}
export default class ExecuteGetFile extends Command {
  async getInteractiveArgs() {
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'bid',
        message: 'Do you want the file you bid for?'
      }
    ]);
    return answer;
  }

  async makeExec(execData: ExecData) {
    const object = JSON.parse(
      readFileSync('myjsonfile.json').toString()
    );
    const c = await readContract(
      Constants.client,
      Constants.contractID
    );
    const address: string =
      c.executables[object[0].prop.valueOf()].executable
        .executable_address;
    const ref = `https://arweave.net/${address}`;

    open(`${address}-feather.wasm`, 'w', (error: any, file: any) => {
      if (error) throw error;
      console.log('Saved!');
    });
    const file = createWriteStream(`${address}-feather.wasm`);
    const request = https.get(ref, (response: any) => {
      response.pipe(file);
    });
    console.log('Download Complete');
  }

  async run() {
    this.log('Welcome to Feather');
    const {args, flags} = this.parse(ExecuteGetFile);
    const {count} = args;
    const {araddress} = flags;

    const execData: ExecData =
      count !== null && count > 0 && araddress === null
        ? {
            bid: false
          }
        : await this.getInteractiveArgs();
    await this.makeExec(execData);
  }
}
