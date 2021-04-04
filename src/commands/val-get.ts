import {Command} from '@oclif/command';
import {prompt} from 'inquirer';
import {readContract} from 'smartweave';
import {ArweaveUtils} from '../i';
import {https} from 'follow-redirects';
import {createWriteStream, open} from 'fs';
interface ExecData {
  executable: string;
  bid: boolean;
}
export default class ExecuteGetFile extends Command {
  async getInteractiveArgs() {
    const answer = await prompt([
      {
        type: 'checkbox',
        name: 'executable',
        message: 'Select the executables',
        default: [
          {name: 1, value: 1},
          {name: 2, value: 2}
        ],
        choices: async () => ArweaveUtils.getContract()
      },
      {
        type: 'confirm',
        name: 'bid',
        message: 'Do you want the file you bid for?'
      }
    ]);
    return answer;
  }

  async makeExec(execData: ExecData) {
    const {executable} = execData;
    const contract = await readContract(
      ArweaveUtils.client,
      ArweaveUtils.contractID
    ).catch((error) => {
      console.log(error);
    });
    const execAddress: Record<string, string> = {
      r: contract.executables[executable].result.address,
      a:
        contract.executables[executable].executable.executable_address
    };
    let fileType = '';
    for (const value in execAddress) {
      if (value) {
        const add = execAddress[value];
        const ref = `https://arweave.net/${add}`;
        const transaction = await ArweaveUtils.client.transactions
          .get(add)
          .then((transaction) => {
            for (const tag of transaction.get('tags')) {
              const value: string = (tag as any).get('value', {
                decode: true,
                string: true
              });
              fileType = value;
            }
          });
        open(`${add}-feather.${fileType}`, 'w', (error) => {
          if (error) throw error;
          console.log(`Saved: ${add}-feather.${fileType}`);
        });
        const request = https.get(ref, (response: any) => {
          response.pipe(
            createWriteStream(`${add}-feather.${fileType}`)
          );
        });
      }
    }
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
