#!/usr/bin/env node
'use strict'

import path from 'path';
import fs from 'fs-extra';

// Get scratch-vm path from command line argument
const args = process.argv.slice(2);
const vmPath = args[0] || '../scratch-editor/packages/scratch-vm';

// modify for your environment
const vmSrcDev = path.resolve(process.cwd(), './src/vm');
const vmSrcOrg = path.resolve(process.cwd(), vmPath, 'src');
const vmRefs = [
    'extension-support',
    'util',
];

console.log(`Using scratch-vm at: ${vmSrcOrg}`);

// Make symbolic link
// Use a relative link target so the link stays valid when the directory tree
// is mounted at a different absolute path (e.g. inside a Docker container).
const makeSymbolicLink = function (to, from) {
    const relativeTo = path.relative(path.dirname(from), to);
    try {
        const stats = fs.lstatSync(from);
        if (stats.isSymbolicLink()) {
            if (fs.readlinkSync(from) === relativeTo) {
                console.log(`Already exists link: ${from} -> ${fs.readlinkSync(from)}`);
                return;
            }
            fs.unlinkSync(from);
        } else {
            fs.renameSync(from, `${from}~`);
        }
    } catch (err) {
        // File not exists.
    }
    fs.symlinkSync(relativeTo, from, 'dir');
    console.log(`Make link: ${from} -> ${fs.readlinkSync(from)}`);
}

vmRefs.forEach(dir => {
    makeSymbolicLink(path.resolve(vmSrcOrg, dir), path.resolve(vmSrcDev, dir));
});