import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';

export async function POST(request: NextRequest) {
  try {
    const { email, credential, challenge } = await request.json();

    if (!email || !credential || !challenge) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000',
      expectedRPID: process.env.WEBAUTHN_RP_ID || 'localhost',
    });

    if (verification.verified && verification.registrationInfo) {
      // In production, store the credential in your database
      // For now, we'll return success with user info
      return NextResponse.json({
        verified: true,
        user: {
          id: email,
          email: email,
          name: email,
          image: null,
        },
        credential: {
          id: verification.registrationInfo.credentialID,
          publicKey: verification.registrationInfo.credentialPublicKey,
          counter: verification.registrationInfo.counter,
        },
      });
    }

    return NextResponse.json({ error: 'Registration verification failed' }, { status: 400 });
  } catch (error) {
    console.error('WebAuthn registration verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}