import { startTelemetryClient, nodeBlockInfoSubject } from './telemetry';
import { notify } from './notifier';
import { NodeBlockInfo } from "./telemetry/connection";
const { providePolkadotApi, performFailover } = require('./polkadot')

const telemetryTimeout = 20000; // in ms

type NodeState = {
    block?: number,
    nodeName?: string,
    account?: string,
    address?: string
}

/**
 * This microservice should every X minutes to check and, if necessary,
 * perfom a failover routine for our Moonriver nodes
 */
const handler = async () => {

    try {

	console.log('Get ENV variables')

	// TELEMETRY_URL
	// your private telemetry url, defaults to public telemetry url
	
	// TESTING_MODE
	// when set to "true", the reassociation extrinsic will not be executed on chain
	
	// BLOCK_LAG_THRESHOLD
	// If a node's current imported block is more than blockLagThreshold blocks behind that current height, then perform failover 
	const blockLagThreshold = process.env.BLOCK_LAG_THRESHOLD ? +process.env.BLOCK_LAG_THRESHOLD : 20;
	
	console.log('Prepare node state data structure')
	const nodeState: {
	    [key: string]: NodeState
	} = {};
	
	console.log('Connect to moonbeam network')
	const polkadotApi = await providePolkadotApi();
	await polkadotApi.isReady;
	// Necessary hack to allow polkadotApi to finish its internal metadata loading
	// apiPromise.isReady unfortunately doesn't wait for those properly
	await new Promise((resolve) => {
	    setTimeout(resolve, 100);
	});
	
	console.log('Get current block number of each one of our nodes from telemetry')
	// Note that, the private telemetry keeps a record of deactivated or stalled nodes;
	// therefore, we will get block numbers even for nodes that have "disconnected" or shut down.
	// If, however, the telemetry server was reset, the disconnected nodes will not show.
	let timedOut = false;
	let nodeCount = 0;
	await new Promise(async (resolve, reject) => {
	    startTelemetryClient()
	    let lastAddedNodeTime: number;
	    nodeBlockInfoSubject.subscribe((data: NodeBlockInfo) => {
		//console.log(data)
		if (!nodeState[data.networkID]) {
		    nodeState[data.networkID] = {
			nodeName: data.nodeName 
		    }
		}
		nodeState[data.networkID].block = data.block
		nodeState[data.networkID].nodeName = data.nodeName
        
		lastAddedNodeTime = +new Date()
		nodeCount++
	    })
	
	    // wait until there is no more data for at least two seconds, then resolve
	    const timeout = setTimeout(() => {
		timedOut = true;
		reject()
	    }, telemetryTimeout)
	    const intervalID = setInterval(() => {
		if (lastAddedNodeTime && (+ new Date()) - lastAddedNodeTime > 2000) {
		    console.log('Finished getting node data from telemetry')
		    clearTimeout(timeout);
		    clearInterval(intervalID);
		    resolve(true);
		}
	    }, 200)
	});

	if (timedOut || nodeCount == 0) {
	    console.error('Telemetry connection timed out or zero nodes found');
	    notify();
	    return
	}

    } catch (e) {
	console.error(e)
	notify()
    }

    console.log('Finished')
}


handler()
