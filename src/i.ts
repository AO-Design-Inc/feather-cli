import {PathLike, readFileSync} from 'fs';
import Arweave from 'Arweave'
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
}
