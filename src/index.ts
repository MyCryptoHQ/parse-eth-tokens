#!/usr/bin/env node

import { run } from './cli';

run(process.argv).catch(error => console.error(error.message));
