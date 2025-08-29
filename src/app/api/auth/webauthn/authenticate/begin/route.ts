import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Get user's registered credentials
    const credentials = global.webauthnCredentials || new Map();
    const userCredentials = Array.from(credentials.entries())
      .filter(([credId, cred]) => cred.username === username)
      .map(([credId, cred]) => ({
        id: credId, // Use the key (base64 string) instead of the stored Buffer
        transports: cred.transports || ['usb', 'nfc']
      }));

    if (userCredentials.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No registered credentials found. Please register first.' },
        { status: 404 }
      );
    }

    console.log('User credentials for auth:', userCredentials);

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: 'localhost',
      allowCredentials: userCredentials,
      userVerification: 'required',
    });

    // Store challenge for verification
    global.webauthnChallenges = global.webauthnChallenges || new Map();
    global.webauthnChallenges.set(username, options.challenge);

    return NextResponse.json({
      success: true,
      data: {
        ...options,
        userId: username
      }
    });
  } catch (error) {
    console.error('Authentication begin error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate authentication options'
      }, 
      { status: 500 }
    );
  }
}