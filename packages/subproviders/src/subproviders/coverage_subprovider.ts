import { Compiler } from '@0xproject/deployer';
import * as _ from 'lodash';
import * as path from 'path';
import * as Web3 from 'web3';

import { Callback, NextCallback } from '../types';

import { Subprovider } from './subprovider';

export interface CoverageSubproviderOpts {
    contractsSourceGlob: string;
}

/*
 * This class implements the web3-provider-engine subprovider interface and collects traces of all transactions that were sent.
 * Source: https://github.com/MetaMask/provider-engine/blob/master/subproviders/subprovider.js
 */
export class CoverageSubprovider extends Subprovider {
    private _tracesByAddress: { [address: string]: Web3.TransactionTrace[] } = {};
    private _opts: CoverageSubproviderOpts;
    constructor(opts: CoverageSubproviderOpts) {
        super();
        this._opts = opts;
    }
    // This method needs to be here to satisfy the interface but linter wants it to be static.
    // tslint:disable-next-line:prefer-function-over-method
    public handleRequest(
        payload: Web3.JSONRPCRequestPayload,
        next: NextCallback,
        end: (err: Error | null, result: any) => void,
    ) {
        switch (payload.method) {
            case 'eth_sendTransaction':
                const toAddress = payload.params;
                console.log(toAddress);
                next(this._onTransactionSent.bind(this, toAddress));
                return;

            default:
                next();
                return;
        }
    }
    // public async computeCoverageAsync(): Promise<void> {
    //     const compilerConfig = {
    //         contractsDir: path.resolve('src/contracts'),
    //         networkId: 1,
    //         optimizerEnabled: true,
    //         artifactsDir: path.resolve('artifacts'),
    //         specifiedContracts: new Set<string>(),
    //     };
    //     const compiler = new Compiler(compilerConfig);
    //     await compiler.compileAllAsync();
    //     // interface PcToLine {
    //     //     [lineNo: number]: number;
    //     // }
    //     // const hitsByLineNo: { [lineNo: number]: number } = {};
    //     // const pcToLineNo: { [pc: number]: number } = {}; // TODO
    //     // for (const trace of this._traces) {
    //     //     const logs = trace.structLogs;
    //     //     for (const log of logs) {
    //     //         const lineNo = pcToLineNo[log.pc];
    //     //         hitsByLineNo[lineNo] = (hitsByLineNo[lineNo] || 0) + 1;
    //     //     }
    //     // }
    // }
    private _onTransactionSent(address: string, err: Error | null, txHash: string, cb: Callback): void {
        const payload = {
            method: 'debug_traceTransaction',
            params: [txHash],
        };
        this.emitPayloadAsync(payload)
            .then((jsonRPCResponsePayload: Web3.JSONRPCResponsePayload) => {
                const trace: Web3.TransactionTrace = jsonRPCResponsePayload.result;
                this._tracesByAddress[address] = [...(this._tracesByAddress[address] || []), trace];
                cb();
            })
            .catch(console.log);
    }
}
