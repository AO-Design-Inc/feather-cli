import {existsSync, lstatSync, PathLike, readFileSync} from 'fs';
import Arweave from 'arweave';
export namespace Constants {
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
}
