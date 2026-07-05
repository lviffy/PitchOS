export interface WalletKeyPair {
    publicKeyHex: string;
    privateKeyHex: string;
    did: string;
}
export declare function generateWalletKeyPair(): Promise<WalletKeyPair>;
export declare function signMessage(privateKeyHex: string, messageText: string): Promise<string>;
