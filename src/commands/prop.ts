// INIT
import {Command} from '@oclif/command';
import {readFileSync} from 'fs';
import {prompt} from 'inquirer';
import {ArweaveUtils} from '../i';
interface FeatherData {
  fileaddress: string;
  araddress: string;
}
export default class Prop extends Command {
  static description = 'Propose file to the system.';
  // Prompts for the user to interface with
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
        type: 'string',
        name: 'fileaddress',
        message:
          'Type/Drop in the path to the file you want to run: ',
        default: null,
        validate: (value) => ArweaveUtils.isPath(value)
      }
    ]);
    return answer;
  }

  async makeFeather(featherData: FeatherData) {
    const {araddress, fileaddress} = featherData;
    this.log('File accepted!');
    // Uploading the files
    const fileType: string = fileaddress.slice(
      fileaddress.lastIndexOf('.') + 1,
      fileaddress.length
    );
    const data: Buffer = readFileSync(fileaddress);
    const transaction = await ArweaveUtils.client.createTransaction(
      {data},
      ArweaveUtils.jwk(araddress)
    );
    transaction.addTag('Content-type', fileType);
    await ArweaveUtils.client.transactions.sign(
      transaction,
      ArweaveUtils.jwk(araddress)
    );
    const uploader = await ArweaveUtils.client.transactions.getUploader(
      transaction
    );
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
      console.log(
        `${uploader.pctComplete} % complete, ${uploader.uploadedChunks} / ${uploader.totalChunks}`
      );
    }

    const write = ArweaveUtils.write(araddress, {
      executable_address: transaction.id,
      executable_kind: 'wasm',
      function: 'propose'
    });
    console.log('Upload Complete');
  }

  async run() {
    this.log('Welcome to Feather');
    const {args, flags} = this.parse(Prop);
    const {count} = args;
    const {araddress, fileaddress} = flags;
    const featherData: FeatherData =
      count !== null &&
      count > 0 &&
      araddress === null &&
      fileaddress === null
        ? {
            fileaddress: '',
            araddress: ''
          }
        : await this.getInteractiveArgs();
    await this.makeFeather(featherData);
  }
}
