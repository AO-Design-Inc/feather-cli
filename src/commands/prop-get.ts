import {Command, flags} from '@oclif/command';
import {prompt} from 'inquirer';
import {string} from '@oclif/command/lib/flags';
import {createWriteStream, open} from 'fs';
import {https} from 'follow-redirects';

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
        type: string,
        name: 'dataAddress',
        message: 'Type in the ARWaeve Address for your result: ',
        default: null,
        validate(value) {
          if (value.length !== 43) {
            return 'This is not a transaction address';
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
    const {bid, dataAddress} = execData;
    this.log('File accepted!');
    if (bid) {
      console.log(dataAddress);
      const ref = 'https://arweave.net/' + dataAddress;

      open(
        dataAddress + '-feather.txt',
        'w',
        (error: any, file: any) => {
          if (error) throw error;
          console.log('Saved!');
        }
      );
      const file = createWriteStream(dataAddress + '-feather.txt');
      const request = https.get(ref, (response: any) => {
        response.pipe(file);
      });
    } else {
      console.log(0);
    }

    console.log('Upload Complete');
  }

  async run() {
    this.log('Welcome to Feather');
    const {args, flags} = this.parse(Execute);
    const {count} = args;
    const {araddress} = flags;

    let execData: ExecData;
    if (count !== null && count > 0 && araddress === null) {
      execData = {
        araddress: '',
        dataAddress: '',
        bidder: {quantity: 0, bidder: ''},
        bid: false
      };
    } else {
      execData = await this.getInteractiveArgs();
    }

    await this.makeExec(execData);
  }
}
