import {Command} from '@oclif/command';
import {readFileSync} from 'fs';
import {prompt} from 'inquirer';
import {readContract} from 'smartweave';
import {ArweaveUtils} from '../i';
import {createHash} from 'crypto';
import Arweave from 'arweave';
interface ExecData {
  fileaddress: string;
  araddress: string;
  executable: string;
  bid: boolean;
}
export default class ExecuteGetFile extends Command {
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
        type: 'checkbox',
        name: 'executable',
        message: 'Select the executables',
        default: [
          {name: 1, value: 1},
          {name: 2, value: 2}
        ],
        choices: async () => getContract()
      },
      {
        type: 'string',
        name: 'fileaddress',
        message:
          'Type/Drop in the path to the file you have validated: ',
        default: null,
        validate: (value) => ArweaveUtils.isPath(value)
      },
      {
        type: 'confirm',
        name: 'bid',
        message: 'Do you want to submit this Result?'
      }
    ]);
    return answer;
  }

  async makeExec(execData: ExecData) {
    const {executable, araddress, fileaddress} = execData;
    const contract = await readContract(
      ArweaveUtils.client,
      ArweaveUtils.contractID
    ).catch((error) => {
      console.log(error);
    });
    this.log('File accepted!');
    const add: string =
      contract.executables[executable].result.address;
    const localFile = readFileSync(fileaddress);
    const localBuffer: string | Uint8Array = new Uint8Array(
      localFile
    );
    const remoteFile:
      | string
      | Uint8Array = await ArweaveUtils.client.transactions.getData(
      add,
      {decode: true}
    );
    const hash = createHash('sha256').update(localFile).digest('hex');
    const validationObject: Record<string, unknown> = {
      hash,
      is_correct: equal(localBuffer, remoteFile as Uint8Array)
    };
    const validationObjectEncrypted = await Arweave.crypto
      .encrypt(Buffer.from(JSON.stringify(validationObject)), 'sokka')
      .then((_) => {
        return Buffer.from(_).toString('hex');
      });
    console.log(validationObjectEncrypted);
    ArweaveUtils.write(araddress, {
      function: 'validate_lock',
      executable_key: executable,
      encrypted_obj: validationObjectEncrypted
    });
    console.log('Upload Complete');
  }

  async run() {
    this.log('Welcome to Feather');
    const {args, flags} = this.parse(ExecuteGetFile);
    const {count} = args;
    const {araddress} = flags;
    const execData: ExecData =
      count !== null && count > 0 && araddress === null
        ? {fileaddress: '', araddress: '', bid: false}
        : await this.getInteractiveArgs();
    await this.makeExec(execData);
  }
}
// Getting executables
async function getContract() {
  const exec = await readContract(
    ArweaveUtils.client,
    ArweaveUtils.contractID
  ).catch((error) => {
    console.log(error);
  });
  const data = exec.executables;
  const inputArray = [];
  for (const i in data)
    if (i) {
      inputArray.push({name: i, value: i});
    }

  return inputArray;
}

// Checking equality
function equal(buf1: Uint8Array, buf2: Uint8Array) {
  if (buf1.byteLength !== buf2.byteLength) return false;
  const dv1 = new Int8Array(buf1);
  const dv2 = new Int8Array(buf2);
  for (let i = 0; i !== buf1.byteLength; i++) {
    if (dv1[i] !== dv2[i]) {
      console.log(false);
      return false;
    }
  }

  console.log(true);
  return true;
}
