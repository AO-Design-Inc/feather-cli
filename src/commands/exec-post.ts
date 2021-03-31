import {Command} from '@oclif/command';
import {readFileSync} from 'fs';
import {prompt} from 'inquirer';
import {interactWrite, interactWriteDryRun, readContract} from 'smartweave';
import {Constants} from '../i';
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
        validate: (value) => Constants.isPath(value)
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
        type: 'string',
        name: 'fileaddress',
        message:
          'Type/Drop in the path to the file you want to run: ',
        default: null,
        validate: (value) => Constants.isPath(value)
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
    this.log('File accepted!');
    const data = readFileSync(fileaddress);
    const fileType: string = fileaddress.slice(
      fileaddress.lastIndexOf('.') + 1,
      fileaddress.length
    );
    const transaction = await Constants.client.createTransaction(
      {data},
      Constants.jwk(araddress)
    );
    transaction.addTag('Content-type', fileType);
    await Constants.client.transactions.sign(
      transaction,
      Constants.jwk(araddress)
    );
    const uploader = await Constants.client.transactions.getUploader(
      transaction
    );
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(
        `${uploader.pctComplete} % complete, ${uploader.uploadedChunks} / ${uploader.totalChunks}`
      );
    }
    console.log(transaction.id);
    interactWrite(
      Constants.client,
      Constants.jwk(araddress),
      Constants.contractID,
      {
        executable_key: executable,
        result_address: transaction.id,
        function: 'result'
      }
    ).catch((error) => {
      console.log(error);
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