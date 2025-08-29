import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

async function verifyWithChallenge(credential: any, expectedChallenge: string, deviceName: string, username: string) {
  const verification = await verifyRegistrationResponse({
    response: credential,
    expectedChallenge,
    expectedOrigin: 'http://localhost:3000',
    expectedRPID: 'localhost',
  });

  console.log('Verification result:', JSON.stringify(verification, null, 2));

  if (verification.verified && verification.registrationInfo) {
    const { registrationInfo } = verification;
    console.log('Registration info:', registrationInfo);

    // Store credential info for authentication
    global.webauthnCredentials = global.webauthnCredentials || new Map();
    const credentialId = registrationInfo.credential.id;
    
    global.webauthnCredentials.set(credentialId, {
      id: Buffer.from(credentialId, 'base64'),
      publicKey: registrationInfo.credential.publicKey,
      counter: registrationInfo.credential.counter,
      deviceName: deviceName || 'Unknown Device',
      username: username,
      transports: registrationInfo.credential.transports || ['usb', 'nfc']
    });

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      data: {
        credentialID: credentialId,
        deviceName: deviceName || 'Unknown Device'
      }
    });
  } else {
    console.log('Verification failed:', verification);
    return NextResponse.json(
      { success: false, error: 'Registration verification failed' },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { credential, deviceName, username } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { success: false, error: 'Credential is required' },
        { status: 400 }
      );
    }

    // Get stored challenge using the username from the credential response
    const challenges = global.webauthnChallenges || new Map();
    const userHandle = credential.response?.userHandle;
    const challengeKey = userHandle ? new TextDecoder().decode(new Uint8Array(userHandle)) : username;
    const expectedChallenge = challenges.get(challengeKey);

    if (!expectedChallenge) {
      // Try to find any existing challenge as fallback
      const allChallenges = Array.from(challenges.entries());
      if (allChallenges.length === 1) {
        const [key, challenge] = allChallenges[0];
        challenges.delete(key);
        return await verifyWithChallenge(credential, challenge, deviceName, key);
      }
      
      return NextResponse.json(
        { success: false, error: 'Registration challenge not found. Please try registering again.' },
        { status: 400 }
      );
    }

    // Clean up challenge and verify
    challenges.delete(challengeKey);
    return await verifyWithChallenge(credential, expectedChallenge, deviceName, challengeKey);
  } catch (error) {
    console.error('Registration verify error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to verify registration'
      }, 
      { status: 500 }
    );
  }
}