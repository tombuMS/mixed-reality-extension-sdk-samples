/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import dotenv from 'dotenv';
import { resolve as resolvePath } from 'path';
import App from './app';

/* eslint-disable no-console */
process.on('uncaughtException', err => console.log('uncaughtException', err));
process.on('unhandledRejection', reason => console.log('unhandledRejection', reason));
/* eslint-enable no-console */

// MRE.log.enable('network');
// MRE.log.enable('network-content');

// Read .env if file exists
dotenv.config();

// This function starts the MRE server. It will be called immediately unless
// we detect that the code is running in a debuggable environment. If so, a
// small delay is introduced allowing time for the debugger to attach before
// the server starts accepting connections.
function runApp() {
	// Start listening for connections, and serve static files.
	const server = new MRE.WebHost({
		baseUrl: 'http://mre-media-player.openode.io',
		baseDir: resolvePath(__dirname, '../public')
	});

	console.log("Running app");

	// Handle new application sessions
	server.adapter.onConnection((context, params) => new App(context, params, server.baseUrl));
}

// Check whether code is running in a debuggable watched filesystem
// environment and if so, delay starting the app by one second to give
// the debugger time to detect that the server has restarted and reconnect.
// The delay value below is in milliseconds so 1000 is a one second delay.
// You may need to increase the delay or be able to decrease it depending
// on the speed of your machine.
const delay = 1000;
const argv = process.execArgv.join();
const isDebug = argv.includes('inspect') || argv.includes('debug');

if (isDebug) {
	setTimeout(runApp, delay);
} else {
	runApp();
}
