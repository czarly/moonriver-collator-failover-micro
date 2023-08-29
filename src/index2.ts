const { providePolkadotApi, performFailover } = require('./polkadot')

const handler = async () => {

  try {

      console.log('Get ENV variables')

      const proxySecretKey = process.env.PROXY_SECRET_KEY
      const activeSessionKey = process.env.ACTIVE_SESSION_KEY
      const backupSessionKey = process.env.BACKUP_SESSION_KEY
      const collatorAccount = process.env.COLLATOR_ACCOUNT


      console.log('Connect to moonbeam network')
      const polkadotApi = await providePolkadotApi();
      await polkadotApi.isReady;
      // Necessary hack to allow polkadotApi to finish its internal metadata loading
      // apiPromise.isReady unfortunately doesn't wait for those properly
      await new Promise((resolve) => {
	  setTimeout(resolve, 100);
      });

      // perform failover
      await performFailover(polkadotApi, proxySecretKey, collatorAccount, activeSessionKey, backupSessionKey)
      console.log('Failover completed')

      process.exit(0)
  } catch (e) {
      console.error(e)
      process.exit(0)
  }

    console.log('Finished')
}

handler()


