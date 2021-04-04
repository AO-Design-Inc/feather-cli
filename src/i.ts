import {existsSync, PathLike, readFileSync} from 'fs';
import {
  interactWrite,
  interactWriteDryRun,
  readContract
} from 'smartweave';
import Arweave from 'arweave';
export namespace ArweaveUtils {
  // Contract address
  export const contractID =
    'bkRi0K8DADQW9TNOpbYtV53EzvRwT9LLwZPGyCwJaAg';
  // Start ARWeave client
  export const client = new Arweave({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  // Read ARWeave wallet
  export const jwk = (x: PathLike) => {
    return JSON.parse(new TextDecoder().decode(readFileSync(x)));
  };
  // Check if string is a path
  export const isPath = (pathName: PathLike) => {
    if (existsSync(pathName)) return true;
    console.log('\nThis is not a filepath');
    return false;
  };
  // InteractWrite
  const writeTest = async (
    a: PathLike,
    o: Record<string, unknown>
  ): Promise<Error | boolean> => {
    return interactWriteDryRun(client, jwk(a), contractID, o).then(
      (data) => {
        return data.type === 'error' ? Error(data.result) : true;
      }
    );
  };
  export const write = async (
    ar: PathLike,
    impObject: Record<string, unknown>
  ) => {
    const testError = await writeTest(ar, impObject);
    const w = 
    testError === true
      ? await interactWrite(client, jwk(ar), contractID, impObject)
      : console.error(testError);
  };
  export const getContract = async () => {
    const exec = await readContract(client, contractID).catch(
      (error) => {
        console.log(error);
      }
    );
    const data = exec.executables;
    const inputArray = [];
    for (const i in data)
      if (i) {
        // Exec.executables[i].accepted_bid === undefined
        inputArray.push({
          name: `${i} bids: ${exec.executables[i].bids.length}`,
          value: i
        });
      }

    return inputArray;
  };
}
