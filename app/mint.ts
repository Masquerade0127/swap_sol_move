import { percentAmount, generateSigner, signerIdentity, createSignerFromKeypair } from '@metaplex-foundation/umi'
import { TokenStandard, createAndMint } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import  "@solana/web3.js";

const umi = createUmi('https://api.testnet.solana.com');// connect testnet environment
const secret = require("./privateKeyArray.json");
const userWallet = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secret));
const userWalletSigner = createSignerFromKeypair(umi, userWallet);
const metadata = {
    name: "Remitano_MOVE_Token",
    symbol: "MOVE",
    uri: "https://ipfs.io/ipfs/QmWD8EzvSEebKEnwnsqCxgVo3BVtHfQzgBJsxs8WR2iJQd",
};

const mint = generateSigner(umi);
umi.use(signerIdentity(userWalletSigner));
umi.use(mplCandyMachine())

createAndMint(umi, {
    mint,
    authority: umi.identity,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: 8,
    amount: 1000000_00000000,
    tokenOwner: userWallet.publicKey,
    tokenStandard: TokenStandard.Fungible,
    }).sendAndConfirm(umi).then(() => {
    console.log("Successfully minted 1 million tokens (", mint.publicKey, ")");
});
