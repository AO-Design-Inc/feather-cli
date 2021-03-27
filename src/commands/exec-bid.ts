import { Command } from '@oclif/command';
import { prompt } from 'inquirer';
import { interactWrite, interactWriteDryRun, readContract } from 'smartweave';
import { Constants } from '../i';
import { readFile, writeFile } from 'fs';
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
        validate(value) {
          const back: number = value.indexOf('\\');
          if (back === -1) {
            return 'This is not a path';
          }

          return true;
        }
      },
      {
        type: 'checkbox',
        name: 'executable',
        message: 'Select the executables',
        default: [
          { name: 1, value: 1 },
          { name: 2, value: 2 }
        ],
        choices: async () => getContract()
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
    const { araddress, executable, bid, bidAmount } = execData;
    this.log('File accepted!');
    if (bid) {
      // Write bid to contract
      await interactWrite(
        Constants.client,
        Constants.jwk(araddress),
        Constants.contractID,
        {
          function: 'bid',
          executable_key: executable,
          quantity: bidAmount
        }
      ).catch((error) => {
        console.log(error);
      });
      // Read & write json file with bid executables address
      readFile(
        'myjsonfile.json',
        'utf8',
        (error: any, data: string) => {
          if (error) {
            console.log(error);
          } else {
            const object = JSON.parse(data);
            object.push({ prop: executable.valueOf() });
            const json = JSON.stringify(object);
            writeFile(
              'myjsonfile.json',
              json,
              'utf8',
              (error: any) => {
                if (error) console.log('error', error);
              }
            );
          }
        }
      );
    }

    console.log('Upload Complete');
  }

  async run() {
    this.log('Welcome to Feather');
    const { args, flags } = this.parse(Execute);
    const { count } = args;
    const { araddress } = flags;
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
    });;
  }
}

async function getContract() {
  const exec = await readContract(
    Constants.client,
    Constants.contractID
  ).catch((error) => {
    console.log(error);
  });
  const data = exec.executables;
  const inputArray = [];
  for (const i in data)
    if (i) {
      inputArray.push({ name: i, value: i });
    }

  return inputArray;
}