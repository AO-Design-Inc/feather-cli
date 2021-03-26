import {Command} from '@oclif/command';
import {readFileSync} from 'fs';
import {prompt} from 'inquirer';
import {interactWrite, readContract} from 'smartweave';
import {Constants} from '../i';
interface ExecData {
  fileaddress: string;
  araddress: string;
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
        validate(value) {
          const back: number = value.indexOf('\\');
          if (back === -1) {
            return 'This is not a path';
          }
          return true;
        }
      },
      {
        type: 'string',
        name: 'fileaddress',
        message:
          'Type/Drop in the path to the file you want to run: ',
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
        message: 'Do you want to submit this Result?'
      }
    ]);
    return answer;
  }
  async makeExec(execData: ExecData) {
    const {araddress, fileaddress} = execData;
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
    const object = JSON.parse(
      readFileSync('myjsonfile.json').toString()
    );
    const exec = await readContract(
      Constants.client,
      Constants.contractID
    );
    const execAddress =
      exec.executables[object[0].prop.valueOf()].executable
        .executable_address;
    interactWrite(
      Constants.client,
      Constants.jwk(araddress),
      Constants.contractID,
      {
        executable_address: execAddress,
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