import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const { username, deviceName } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Convert username to Uint8Array as required by SimpleWebAuthn
    const userID = new TextEncoder().encode(username);

    // SimpleWebAuthn registration options
    const options = await generateRegistrationOptions({
      rpName: 'Family Vault Enterprise',
      rpID: 'localhost',
      userID: userID,
      userName: username,
      userDisplayName: username,
      attestationType: 'none',
      excludeCredentials: [],
      authenticatorSelection: {
        residentKey: 'discouraged',
        userVerification: 'required',
        authenticatorAttachment: 'cross-platform',
      },
      supportedAlgorithmIDs: [-7, -257],
    });

    // Store challenge in session/memory for verification
    // In production, store this in Redis or database
    global.webauthnChallenges = global.webauthnChallenges || new Map();
    global.webauthnChallenges.set(username, options.challenge);

    return NextResponse.json({
      success: true,
      data: options
    });
  } catch (error) {
    console.error('Registration begin error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate registration options'
      }, 
      { status: 500 }
    );
  }
}