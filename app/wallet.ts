import {
    SystemProgram,
    Keypair,
    Transaction,
    sendAndConfirmTransaction,
    Connection,
    clusterApiUrl,
    LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as fs from "fs";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

// amount of space to reserve for the account
const space = 0;
// Seed the created account with lamports for rent exemption
(async () => {
    const connection = new Connection(clusterApiUrl("testnet"), "confirmed");
    const keypair = Keypair.generate();

    const publicKey = keypair.publicKey;
    const privateKey = bs58.encode(keypair.secretKey);

    console.log("Generate new wallet - public key: ", publicKey.toString());
    console.log("Generate new wallet - secret key: ", privateKey);

    const privateKeyArray = keypair.secretKey
        .toString() //convert secret key to string
        .split(',') //delimit string by commas and convert to an array of strings
        .map(value => Number(value)); //convert string values to numbers inside the array

    const secret = JSON.stringify(privateKeyArray); //Covert to JSON string

    fs.writeFile('privateKeyArray.json', secret, 'utf8', function (err) {
        if (err) throw err;
        console.log('Wrote secret key to privateKeyArray.json.');
    });
    const airDropSignature = await connection.requestAirdrop(publicKey, LAMPORTS_PER_SOL/2);

    try {
        const transactionId = await airDropSignature;
        console.log(`transaction ID: ${transactionId}`);
        console.log(`https://explorer.solana.com/tx/${transactionId}?cluster=testnet`);
    } catch (exception) {
        console.log(exception);
    }
    console.log("request rent before");
    const rentExemptionAmount = await connection.getMinimumBalanceForRentExemption(space);
    const newAccountPubkey = Keypair.generate();
    console.log("request rent after");
    const createAccountParams = {
        fromPubkey: publicKey,
        newAccountPubkey: newAccountPubkey.publicKey,
        lamports: rentExemptionAmount,
        space,
        programId: SystemProgram.programId,
    };
    console.log("aaa");
    const createAccountTransaction = new Transaction().add(
        SystemProgram.createAccount(createAccountParams)
    );
    console.log("bbb");
    await sendAndConfirmTransaction(connection, createAccountTransaction, [
        keypair
    ]);

    console.log("Generate transaction account done");
})();

