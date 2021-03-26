import {Command, flags} from '@oclif/command';
import {prompt} from 'inquirer';
import {interactWrite, interactWriteDryRun, readContract} from 'smartweave';
import {string} from '@oclif/command/lib/flags';
import {Constants} from '../i';

interface ExecData {
  araddress: string;
  bidder: Record<string, unknown>;
  dataAddress: string;
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
        validate(value) {
          const back: number = value.indexOf('\\');
          if (back === -1) {
            return 'This is not a path';
          }

          return true;
        }
      },
      {
        type: string,
        name: 'dataAddress',
        message: 'Type in the ARWaeve Address for your transaction: ',
        default: null,
        validate(value) {
          const back: number = value.indexOf('\\');
          if (back === -1) {
            return 'This is not a path';
          }

          return true;
        }
      },
      {
        type: 'confirm',
        name: 'bid',
        message: 'Do you want to accept the bid?'
      }
    ]);

    return answer;
  }

  async makeExec(execData: ExecData) {
    const {araddress, bid, dataAddress} = execData;
    this.log('File accepted!');
    if (bid) {
      const exec = await readContract(
        Constants.client,
        Constants.contractID
      );
      const data = exec.executables;
      // Implement method to automatically return lowest bid

      // Console.log(typeof Object.values(data[dataAddress].bids))
      await interactWriteDryRun(
        Constants.client,
        Constants.jwk(araddress),
        Constants.contractID,
        {
          function: 'accept',
          executable_key: dataAddress,
          accepted_bid: data[dataAddress].bids[0].bidder
        }
      ).catch((error)=>{
          console.log(error)
      })
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
            dataAddress: '',
            bidder: {quantity: 0, bidder: ''},
            bid: false
          }
        : await this.getInteractiveArgs();

    await this.makeExec(execData);
  }
}