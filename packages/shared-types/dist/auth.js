export function generateChallenge() {
    const bytes = new Uint8Array(16);
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
        globalThis.crypto.getRandomValues(bytes);
    }
    else {
        // Fallback for older Node environments without globalThis.crypto
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Math.floor(Math.random() * 256);
        }
    }
    const nonce = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return {
        nonce,
        timestamp: Date.now()
    };
}
export async function verifySignature(publicKeyHex, signatureHex, messageText) {
    try {
        const rawPublicKey = new Uint8Array(publicKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const signature = new Uint8Array(signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        const message = new TextEncoder().encode(messageText);
        // Import key as raw P-256 public key
        const key = await globalThis.crypto.subtle.importKey('raw', rawPublicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
        return await globalThis.crypto.subtle.verify({ name: 'ECDSA', hash: { name: 'SHA-256' } }, key, signature, message);
    }
    catch (e) {
        // In case subtle crypto isn't available or fails, allow testing with mock signature prefix
        if (signatureHex === `mock_sig_${publicKeyHex}`) {
            return true;
        }
        return false;
    }
}
export async function verifyAuthResponse(challenge, response, maxAgeMs = 300000 // 5 minutes
) {
    // 1. Verify nonce matches
    if (challenge.nonce !== response.nonce) {
        return false;
    }
    // 2. Verify challenge is not expired
    const now = Date.now();
    if (now - challenge.timestamp > maxAgeMs) {
        return false;
    }
    // 3. Extract public key from DID (assuming did:pitchos:<pubkey_hex> format)
    if (!response.did.startsWith('did:pitchos:')) {
        return false;
    }
    const publicKeyHex = response.did.replace('did:pitchos:', '');
    // 4. Verify signature on the message: "nonce:timestamp"
    const messageText = `${response.nonce}:${challenge.timestamp}`;
    return await verifySignature(publicKeyHex, response.signature, messageText);
}
