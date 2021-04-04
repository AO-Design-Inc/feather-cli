import {Command} from '@oclif/command';
import {prompt} from 'inquirer';
import {ArweaveUtils} from '../i';
interface ExecData {
  araddress: string;
  executable: string;
  bidAmount: number;
  bid: boolean;
}
export default class Execute extends Command {
  async getInteractiveArgs() {
    const answer = await prompt([
      {
        type: 'string',
        name: 'araddress',
        message: 'Type/Drop in the path to your ARWeave key-file: ',
        default: null,
        validate: (value) => ArweaveUtils.isPath(value)
      },
      {
        type: 'list',
        name: 'executable',
        message: 'Select the executables',
        default: [
          {name: 1, value: 1},
          {name: 2, value: 2}
        ],
        choices: async () => ArweaveUtils.getContract()
      },
      {
        type: 'number',
        name: 'bidAmount',
        message:
          'Enter How much you want to be paid for this compute: ',
        default: null,
        validate(value) {
          if (typeof value !== 'number') {
            return 'This is not a number';
          }

          return true;
        }
      },
      {
        type: 'confirm',
        name: 'bid',
        message: 'Do you want to place the bid?'
      }
    ]);

    return answer;
  }

  async makeExec(execData: ExecData) {
    const {araddress, executable, bid, bidAmount} = execData;
    if (bid) {
      // Write bid to contract
      ArweaveUtils.write(araddress, {
        function: 'bid',
        executable_key: executable,
        quantity: bidAmount
      });
    }

    console.log('Upload Complete');
  }

  async run() {
    this.log('Welcome to Feather');
    const {args, flags} = this.parse(Execute);
    const {count} = args;
    const {araddress} = flags;
    const execData: ExecData =
      count !== null && count > 0 && araddress === null
        ? {
            araddress: '',
            executable: '',
            bidAmount: 0,
            bid: false
          }
        : await this.getInteractiveArgs();

    await this.makeExec(execData).catch((error) => {
      console.log(error);
    });
  }
}
