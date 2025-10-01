import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const { email, credential, challenge } = await request.json();

    if (!credential || !challenge) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // In production, retrieve the stored credential from your database
    // For now, we'll simulate a successful authentication
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
      authenticator: {
        credentialID: new Uint8Array(), // Should be from database
        credentialPublicKey: new Uint8Array(), // Should be from database
        counter: 0, // Should be from database
      },
    });

    if (verification.verified) {
      return NextResponse.json({
        verified: true,
        user: {
          id: email || 'passkey-user',
          email: email || 'passkey-user@example.com',
          name: email || 'Passkey User',
          image: null,
        },
      });
    }

    return NextResponse.json({ error: 'Authentication verification failed' }, { status: 400 });
  } catch (error) {
    console.error('WebAuthn authentication verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}