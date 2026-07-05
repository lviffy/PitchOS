import { DIDChallenge, DIDAuthResponse } from './index';
export declare function generateChallenge(): DIDChallenge;
export declare function verifySignature(publicKeyHex: string, signatureHex: string, messageText: string): Promise<boolean>;
export declare function verifyAuthResponse(challenge: DIDChallenge, response: DIDAuthResponse, maxAgeMs?: number): Promise<boolean>;
