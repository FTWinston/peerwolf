import { WolfServer } from './WolfServer';

export default {} as typeof Worker & (new () => Worker);

const worker: Worker = self as any; // eslint-disable-line no-restricted-globals

const server = new WolfServer(msg => worker.postMessage(msg));

worker.onmessage = e => server.receiveMessage(e.data);